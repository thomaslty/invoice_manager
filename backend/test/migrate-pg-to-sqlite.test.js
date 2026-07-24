import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const PG_URL =
  process.env.MIGRATION_TEST_PG_URL ||
  'postgresql://invoice_user:invoice_pass@localhost:5432/invoice_manager';
const FIXTURE_DIR = fileURLToPath(new URL('./fixtures/pg-migrations', import.meta.url));

const UNICODE_CLIENT = 'Ünîcödé Œî Café ☕';

let pgClient;
let db;
let sqlite;
let schema;
let ops;
let runMigration;
let tmpDir;
let pgAvailable = false;
const pgCounts = {};

function invoiceJson({ client, refNo, date, total }) {
  return {
    sections: {
      metadata: { fields: { refNo, client, date } },
      items: { categories: [{ items: [{ total }] }] },
    },
  };
}

async function buildAndSeedSource(client) {
  // Reset to a clean schema, then replay the preserved Postgres migrations to
  // reproduce a realistic production source schema.
  await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  const files = readdirSync(FIXTURE_DIR).filter((f) => f.endsWith('.sql')).sort();
  for (const f of files) {
    const text = readFileSync(join(FIXTURE_DIR, f), 'utf8');
    for (const stmt of text.split('--> statement-breakpoint')) {
      const trimmed = stmt.trim();
      if (trimmed) await client.query(trimmed);
    }
  }

  // Seed edge-case rows.
  const { rows: userRows } = await client.query(
    `INSERT INTO users (email, name) VALUES ('owner@test.com', 'Owner') RETURNING id`,
  );
  const userId = userRows[0].id;
  const { rows: fontRows } = await client.query(
    `INSERT INTO fonts (name, family, source, uploaded_by) VALUES ('Custom', 'Custom, serif', 'local', $1) RETURNING id`,
    [userId],
  );
  const fontId = fontRows[0].id;
  const { rows: tplRows } = await client.query(
    `INSERT INTO templates (user_id, name, font_id, json_data) VALUES ($1, 'Tpl', $2, $3) RETURNING id`,
    [userId, fontId, invoiceJson({ client: 'Tpl', refNo: 'T', date: '2026-01-01', total: 0 })],
  );
  const templateId = tplRows[0].id;

  // Three invoices: decimal total + real font, unicode client + NULL font, and a third for ordering.
  const { rows: invA } = await client.query(
    `INSERT INTO invoices (user_id, template_id, font_id, ref_no, client_name, date, total_amount, json_data)
     VALUES ($1, $2, $3, 'INV-A', 'ACME Corp', '2026-01-15', 100.50, $4) RETURNING id`,
    [userId, templateId, fontId, invoiceJson({ client: 'ACME Corp', refNo: 'INV-A', date: '2026-01-15', total: 100.5 })],
  );
  await client.query(
    `INSERT INTO invoices (user_id, font_id, ref_no, client_name, date, total_amount, json_data)
     VALUES ($1, NULL, 'INV-B', $2, '2026-02-20', 9.99, $3)`,
    [userId, UNICODE_CLIENT, invoiceJson({ client: UNICODE_CLIENT, refNo: 'INV-B', date: '2026-02-20', total: 9.99 })],
  );
  await client.query(
    `INSERT INTO invoices (user_id, ref_no, client_name, date, total_amount, json_data)
     VALUES ($1, 'INV-C', 'Beta', '2026-03-01', 20.00, $2)`,
    [userId, invoiceJson({ client: 'Beta', refNo: 'INV-C', date: '2026-03-01', total: 20 })],
  );
  await client.query(
    `INSERT INTO invoice_snapshots (invoice_id, name, font_id, json_data)
     VALUES ($1, 'Snap A', $2, $3)`,
    [invA[0].id, fontId, invoiceJson({ client: 'ACME Corp', refNo: 'INV-A', date: '2026-01-15', total: 100.5 })],
  );
  await client.query(
    `INSERT INTO sessions (id, user_id, expires_at) VALUES ('sess-1', $1, now() + interval '1 day')`,
    [userId],
  );

  // Capture source counts for comparison.
  for (const t of ['users', 'fonts', 'templates', 'invoices', 'invoice_snapshots', 'sessions']) {
    const { rows } = await client.query(`SELECT count(*)::int AS n FROM ${t}`);
    pgCounts[t] = rows[0].n;
  }
}

before(async () => {
  tmpDir = mkdtempSync(join(tmpdir(), 'invmgr-mig-'));
  process.env.DATABASE_PATH = join(tmpDir, 'test.db');
  ({ db, sqlite } = await import('../src/db/index.js'));
  schema = await import('../src/db/schema.js');
  ops = await import('drizzle-orm');
  ({ runMigration } = await import('../scripts/migrate-pg-to-sqlite.js'));
  const { migrate } = await import('drizzle-orm/better-sqlite3/migrator');
  migrate(db, { migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)) });

  pgClient = new pg.Client({ connectionString: PG_URL });
  try {
    await pgClient.connect();
    pgAvailable = true;
  } catch (err) {
    console.error(
      `\n[SKIP] Postgres not reachable at ${PG_URL}: ${err.message}\n` +
        `Start it with: docker compose -f docker-compose.migration_test.yml up -d\n`,
    );
    return;
  }
  await buildAndSeedSource(pgClient);
  await runMigration(pgClient, db, schema); // one-time import under test
});

after(async () => {
  if (pgClient) {
    try {
      await pgClient.end();
    } catch {
      /* ignore */
    }
  }
  sqlite?.close();
  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
});

async function count(table) {
  const rows = await db.select().from(table);
  return rows.length;
}

test('row counts match the Postgres source for every table', async (t) => {
  if (!pgAvailable) return t.skip('Postgres not available');
  assert.equal(await count(schema.users), pgCounts.users);
  assert.equal(await count(schema.fonts), pgCounts.fonts);
  assert.equal(await count(schema.templates), pgCounts.templates);
  assert.equal(await count(schema.invoices), pgCounts.invoices);
  assert.equal(await count(schema.invoiceSnapshots), pgCounts.invoice_snapshots);
  assert.equal(await count(schema.sessions), pgCounts.sessions);
});

test('json_data round-trips as an object after import', async (t) => {
  if (!pgAvailable) return t.skip('Postgres not available');
  const [inv] = await db
    .select()
    .from(schema.invoices)
    .where(ops.eq(schema.invoices.refNo, 'INV-A'));
  assert.equal(typeof inv.jsonData, 'object');
  assert.equal(inv.jsonData.sections.metadata.fields.client, 'ACME Corp');
});

test('unicode client names survive the import', async (t) => {
  if (!pgAvailable) return t.skip('Postgres not available');
  const [inv] = await db
    .select()
    .from(schema.invoices)
    .where(ops.eq(schema.invoices.refNo, 'INV-B'));
  assert.equal(inv.clientName, UNICODE_CLIENT);
  assert.equal(inv.fontId, null); // NULL font reference preserved
});

test('total_amount orders numerically after import', async (t) => {
  if (!pgAvailable) return t.skip('Postgres not available');
  const rows = await db
    .select()
    .from(schema.invoices)
    .orderBy(ops.asc(schema.invoices.totalAmount));
  assert.deepEqual(rows.map((r) => Number(r.totalAmount)), [9.99, 20, 100.5]);
});

test('re-running the import is idempotent (guarded skip)', async (t) => {
  if (!pgAvailable) return t.skip('Postgres not available');
  const before = await count(schema.invoices);
  const summary = await runMigration(pgClient, db, schema);
  assert.match(String(summary.invoices), /skipped/);
  assert.equal(await count(schema.invoices), before);
});

test('foreign keys imported intact — deleting a user cascades', async (t) => {
  if (!pgAvailable) return t.skip('Postgres not available');
  const [owner] = await db
    .select()
    .from(schema.users)
    .where(ops.eq(schema.users.email, 'owner@test.com'));
  await db.delete(schema.users).where(ops.eq(schema.users.id, owner.id));
  assert.equal(await count(schema.invoices), 0);
  assert.equal(await count(schema.invoiceSnapshots), 0);
  assert.equal(await count(schema.sessions), 0);
  assert.equal(await count(schema.templates), 0);
});
