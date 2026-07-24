import { sqliteTable, integer, text, numeric, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull(),
  name: text('name'),
  oidcSub: text('oidc_sub'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
}, (table) => [
  uniqueIndex('users_email_idx').on(table.email),
]);

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
}, (table) => [
  index('sessions_expires_at_idx').on(table.expiresAt),
]);

export const fonts = sqliteTable('fonts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  family: text('family').notNull(),
  source: text('source').notNull(), // 'system' | 'remote' | 'local'
  filePath: text('file_path'),
  url: text('url'),
  uploadedBy: integer('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

export const templates = sqliteTable('templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  fontId: integer('font_id').references(() => fonts.id, { onDelete: 'set null' }),
  jsonData: text('json_data', { mode: 'json' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

export const invoices = sqliteTable('invoices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  templateId: integer('template_id').references(() => templates.id, { onDelete: 'set null' }),
  fontId: integer('font_id').references(() => fonts.id, { onDelete: 'set null' }),
  refNo: text('ref_no'),
  clientName: text('client_name'),
  date: text('date'),
  totalAmount: numeric('total_amount'),
  jsonData: text('json_data', { mode: 'json' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
}, (table) => [
  index('invoices_user_id_idx').on(table.userId),
  index('invoices_ref_no_idx').on(table.refNo),
  index('invoices_client_name_idx').on(table.clientName),
  index('invoices_date_idx').on(table.date),
]);

export const invoiceSnapshots = sqliteTable('invoice_snapshots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  invoiceId: integer('invoice_id').references(() => invoices.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  fontId: integer('font_id').references(() => fonts.id, { onDelete: 'set null' }),
  jsonData: text('json_data', { mode: 'json' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});
