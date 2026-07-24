import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Fresh temp SQLite DB for the whole file. db/index.js reads DATABASE_PATH at
// import time, so set it before the dynamic import.
let db, sqlite, schema, ops, invoiceService, tmpDir;

before(async () => {
  tmpDir = mkdtempSync(join(tmpdir(), 'invmgr-db-'));
  process.env.DATABASE_PATH = join(tmpDir, 'test.db');
  ({ db, sqlite } = await import('../src/db/index.js'));
  schema = await import('../src/db/schema.js');
  ops = await import('drizzle-orm');
  invoiceService = await import('../src/services/invoiceService.js');
  const { migrate } = await import('drizzle-orm/better-sqlite3/migrator');
  migrate(db, { migrationsFolder: new URL('../drizzle', import.meta.url).pathname });
});

after(() => {
  sqlite?.close();
  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
});

function invoiceJson({ client = 'Test Co', refNo = 'R-1', date = '2026-01-01', total = 0 } = {}) {
  return {
    sections: {
      metadata: { fields: { refNo, client, date } },
      items: { categories: [{ items: [{ total }] }] },
    },
  };
}

async function makeUser(email) {
  const [user] = await db.insert(schema.users).values({ email }).returning();
  return user;
}

test('modern pragmas are active on the connection', () => {
  assert.equal(sqlite.pragma('foreign_keys', { simple: true }), 1);
  assert.equal(sqlite.pragma('journal_mode', { simple: true }), 'wal');
  assert.equal(sqlite.pragma('busy_timeout', { simple: true }), 5000);
});

test('json_data round-trips as an object, not a string', async () => {
  const user = await makeUser('json@test.com');
  const created = await invoiceService.createInvoice(
    { jsonData: invoiceJson({ client: 'JSON Co', total: 42 }) },
    user.id,
  );
  const fetched = await invoiceService.getInvoiceById(created.id, user.id);
  assert.equal(typeof fetched.jsonData, 'object');
  assert.equal(fetched.jsonData.sections.metadata.fields.client, 'JSON Co');
});

test('foreign key ON DELETE CASCADE removes dependent invoices', async () => {
  const user = await makeUser('cascade@test.com');
  await invoiceService.createInvoice({ jsonData: invoiceJson() }, user.id);
  await db.delete(schema.users).where(ops.eq(schema.users.id, user.id));
  const remaining = await db
    .select()
    .from(schema.invoices)
    .where(ops.eq(schema.invoices.userId, user.id));
  assert.equal(remaining.length, 0);
});

test('foreign key ON DELETE SET NULL nulls font references', async () => {
  const user = await makeUser('setnull@test.com');
  const [font] = await db
    .insert(schema.fonts)
    .values({ name: 'Tmp', family: 'Tmp, sans-serif', source: 'system' })
    .returning();
  const inv = await invoiceService.createInvoice(
    { fontId: font.id, jsonData: invoiceJson() },
    user.id,
  );
  await db.delete(schema.fonts).where(ops.eq(schema.fonts.id, font.id));
  const fetched = await invoiceService.getInvoiceById(inv.id, user.id);
  assert.equal(fetched.fontId, null);
});

test('total_amount orders numerically, not lexicographically', async () => {
  const user = await makeUser('order@test.com');
  for (const total of [9, 100, 20]) {
    await invoiceService.createInvoice({ jsonData: invoiceJson({ total }) }, user.id);
  }
  const rows = await invoiceService.listInvoices({
    userId: user.id,
    sortBy: 'total_amount',
    sortOrder: 'asc',
  });
  assert.deepEqual(rows.map((r) => Number(r.totalAmount)), [9, 20, 100]);
});

test('invoice search is case-insensitive', async () => {
  const user = await makeUser('search@test.com');
  await invoiceService.createInvoice(
    { jsonData: invoiceJson({ client: 'ACME Corp' }) },
    user.id,
  );
  const rows = await invoiceService.listInvoices({ userId: user.id, search: 'acme' });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].clientName, 'ACME Corp');
});
