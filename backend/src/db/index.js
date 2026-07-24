import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const dbPath = process.env.DATABASE_PATH || 'data/invoice.db';
mkdirSync(dirname(dbPath), { recursive: true });

export const sqlite = new Database(dbPath);
// Modern pragmas — SQLite keeps these off by default for backward compat.
sqlite.pragma('journal_mode = WAL');   // concurrent reads during writes (persisted)
sqlite.pragma('foreign_keys = ON');    // enforce ON DELETE cascade/set null (per-connection)
sqlite.pragma('busy_timeout = 5000');  // wait instead of throwing SQLITE_BUSY
sqlite.pragma('synchronous = NORMAL'); // safe and faster under WAL

export const db = drizzle(sqlite);
