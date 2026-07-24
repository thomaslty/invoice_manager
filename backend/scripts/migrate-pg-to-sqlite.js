import 'dotenv/config';
import pg from 'pg';
import { pathToFileURL } from 'node:url';

// Return Postgres `date` (OID 1082) as a plain 'YYYY-MM-DD' string instead of a
// JS Date, so it maps directly into SQLite's text `date` column with no TZ drift.
pg.types.setTypeParser(1082, (v) => v);

// Foreign-key-safe insertion order. Keys are schema export names.
const TABLES = ['users', 'fonts', 'templates', 'invoices', 'invoiceSnapshots', 'sessions'];

const PG_TABLE = {
  users: 'users',
  fonts: 'fonts',
  templates: 'templates',
  invoices: 'invoices',
  invoiceSnapshots: 'invoice_snapshots',
  sessions: 'sessions',
};

// Map a raw snake_case Postgres row to the drizzle (camelCase) insert shape.
// jsonb arrives already parsed as an object; timestamps arrive as Date objects
// which drizzle's timestamp mode converts to unix seconds on write.
const MAPPERS = {
  users: (r) => ({
    id: r.id, email: r.email, name: r.name, oidcSub: r.oidc_sub, createdAt: r.created_at,
  }),
  fonts: (r) => ({
    id: r.id, name: r.name, family: r.family, source: r.source,
    filePath: r.file_path, url: r.url, uploadedBy: r.uploaded_by, createdAt: r.created_at,
  }),
  templates: (r) => ({
    id: r.id, userId: r.user_id, name: r.name, fontId: r.font_id,
    jsonData: r.json_data, createdAt: r.created_at, updatedAt: r.updated_at,
  }),
  invoices: (r) => ({
    id: r.id, userId: r.user_id, templateId: r.template_id, fontId: r.font_id,
    refNo: r.ref_no, clientName: r.client_name, date: r.date,
    totalAmount: r.total_amount === null ? null : String(r.total_amount),
    jsonData: r.json_data, createdAt: r.created_at, updatedAt: r.updated_at,
  }),
  invoiceSnapshots: (r) => ({
    id: r.id, invoiceId: r.invoice_id, name: r.name, fontId: r.font_id,
    jsonData: r.json_data, createdAt: r.created_at,
  }),
  sessions: (r) => ({
    id: r.id, userId: r.user_id, expiresAt: r.expires_at, createdAt: r.created_at,
  }),
};

/**
 * Copy all rows from a Postgres source into the SQLite database.
 * Guarded and idempotent: any target table that already has rows is skipped.
 * @returns {Promise<Record<string, number|string>>} per-table summary
 */
export async function runMigration(pgClient, db, schema) {
  const summary = {};
  for (const key of TABLES) {
    const table = schema[key];
    const existing = await db.select().from(table).limit(1);
    if (existing.length > 0) {
      summary[key] = 'skipped (target not empty)';
      continue;
    }
    const { rows } = await pgClient.query(`SELECT * FROM ${PG_TABLE[key]} ORDER BY id`);
    if (rows.length === 0) {
      summary[key] = 0;
      continue;
    }
    await db.insert(table).values(rows.map(MAPPERS[key]));
    summary[key] = rows.length;
  }
  return summary;
}

async function main() {
  const pgUrl = process.env.MIGRATE_FROM_POSTGRES_URL;
  if (!pgUrl) {
    console.log('MIGRATE_FROM_POSTGRES_URL not set — skipping data import.');
    return;
  }
  const { db } = await import('../src/db/index.js');
  const schema = await import('../src/db/schema.js');
  const client = new pg.Client({ connectionString: pgUrl });
  await client.connect();
  try {
    const summary = await runMigration(client, db, schema);
    console.log('Postgres → SQLite import summary:', summary);
  } finally {
    await client.end();
  }
}

// Run only when executed directly (not when imported by the test).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
