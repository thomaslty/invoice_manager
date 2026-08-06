import { test, describe, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { toIsoDate } from '../src/lib/invoiceDate.js';

const MIGRATION = new URL('../drizzle/0001_backfill_invoice_date_iso.sql', import.meta.url);

let sql;
let dir;
let db;

/** Rows the migration is expected to convert, plus rows it must leave alone. */
const ROWS = [
  { id: 1, date: '30 September, 2022', expected: '2022-09-30' },
  { id: 2, date: '02 Jan, 2026', expected: '2026-01-02' },
  { id: 3, date: '1 December, 2025', expected: '2025-12-01' },
  { id: 4, date: '5 Mar, 2020', expected: '2020-03-05' },
  { id: 5, date: '30 September 2022', expected: '2022-09-30' },
  // Already migrated — must stay exactly as-is.
  { id: 6, date: '2019-07-04', expected: '2019-07-04' },
  // Unparseable or ambiguous — must be left untouched, never nulled.
  { id: 7, date: '01/02/2026', expected: '01/02/2026' },
  { id: 8, date: 'Q3 invoice', expected: 'Q3 invoice' },
  { id: 9, date: '31 February, 2022', expected: '31 February, 2022' },
  { id: 10, date: '29 February, 2023', expected: '29 February, 2023' },
  { id: 11, date: '', expected: '' },
  { id: 12, date: null, expected: null },
];

function seed() {
  db.exec(`
    CREATE TABLE invoices (
      id INTEGER PRIMARY KEY,
      date TEXT,
      json_data TEXT NOT NULL
    );
  `);
  const insert = db.prepare('INSERT INTO invoices (id, date, json_data) VALUES (?, ?, ?)');
  for (const row of ROWS) {
    insert.run(row.id, row.date, JSON.stringify({ sections: { metadata: { fields: { date: row.date } } } }));
  }
}

function dates() {
  return Object.fromEntries(
    db.prepare('SELECT id, date FROM invoices ORDER BY id').all().map((r) => [r.id, r.date])
  );
}

describe('0001_backfill_invoice_date_iso migration', () => {
  before(() => {
    sql = fs.readFileSync(MIGRATION, 'utf8');
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'backfill-test-'));
  });

  beforeEach(() => {
    if (db) db.close();
    db = new Database(path.join(dir, `t-${Math.floor(process.hrtime()[1])}.db`));
    seed();
  });

  after(() => {
    if (db) db.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  test('converts display dates to ISO', () => {
    db.exec(sql);
    const result = dates();
    for (const row of ROWS) {
      assert.equal(result[row.id], row.expected, `row ${row.id} (${row.date})`);
    }
  });

  test('never writes null over an existing value', () => {
    db.exec(sql);
    const nulled = db
      .prepare("SELECT id FROM invoices WHERE date IS NULL AND id <> 12")
      .all();
    assert.deepEqual(nulled, [], 'no row lost its date');
  });

  test('leaves json_data untouched', () => {
    const before = db.prepare('SELECT id, json_data FROM invoices ORDER BY id').all();
    db.exec(sql);
    const after = db.prepare('SELECT id, json_data FROM invoices ORDER BY id').all();
    assert.deepEqual(after, before);
  });

  test('running it twice changes nothing', () => {
    db.exec(sql);
    const once = dates();
    db.exec(sql);
    assert.deepEqual(dates(), once);
  });

  test('agrees with the parser the app uses at save time', () => {
    db.exec(sql);
    const result = dates();
    for (const row of ROWS) {
      const viaApp = toIsoDate(row.date);
      if (viaApp !== null) {
        assert.equal(result[row.id], viaApp, `row ${row.id} (${row.date})`);
      }
    }
  });

  test('sorts chronologically after migrating', () => {
    db.exec(sql);
    const order = db
      .prepare("SELECT date FROM invoices WHERE date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' ORDER BY date DESC")
      .all()
      .map((r) => r.date);
    assert.deepEqual(order, ['2026-01-02', '2025-12-01', '2022-09-30', '2022-09-30', '2020-03-05', '2019-07-04']);
  });
});
