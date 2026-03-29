import { pgTable, serial, varchar, text, timestamp, integer, numeric, date, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  oidcSub: varchar('oidc_sub', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('users_email_idx').on(table.email),
]);

export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 64 }).primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('sessions_expires_at_idx').on(table.expiresAt),
]);

export const fonts = pgTable('fonts', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  family: varchar('family', { length: 255 }).notNull(),
  source: varchar('source', { length: 20 }).notNull(), // 'system' | 'remote' | 'local'
  filePath: text('file_path'),
  url: text('url'),
  uploadedBy: integer('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const templates = pgTable('templates', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  fontId: integer('font_id').references(() => fonts.id, { onDelete: 'set null' }),
  jsonData: jsonb('json_data').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  templateId: integer('template_id').references(() => templates.id, { onDelete: 'set null' }),
  fontId: integer('font_id').references(() => fonts.id, { onDelete: 'set null' }),
  refNo: varchar('ref_no', { length: 100 }),
  clientName: varchar('client_name', { length: 255 }),
  date: date('date'),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }),
  jsonData: jsonb('json_data').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('invoices_user_id_idx').on(table.userId),
  index('invoices_ref_no_idx').on(table.refNo),
  index('invoices_client_name_idx').on(table.clientName),
  index('invoices_date_idx').on(table.date),
]);

export const invoiceSnapshots = pgTable('invoice_snapshots', {
  id: serial('id').primaryKey(),
  invoiceId: integer('invoice_id').references(() => invoices.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  fontId: integer('font_id').references(() => fonts.id, { onDelete: 'set null' }),
  jsonData: jsonb('json_data').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
