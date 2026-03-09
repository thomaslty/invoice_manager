import { pgTable, serial, varchar, text, timestamp, integer, numeric, date, jsonb } from 'drizzle-orm/pg-core';

export const fonts = pgTable('fonts', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  family: varchar('family', { length: 255 }).notNull(),
  source: varchar('source', { length: 20 }).notNull(), // 'system' | 'remote' | 'local'
  filePath: text('file_path'),
  url: text('url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const templates = pgTable('templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  fontId: integer('font_id').references(() => fonts.id),
  jsonData: jsonb('json_data').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  templateId: integer('template_id').references(() => templates.id),
  fontId: integer('font_id').references(() => fonts.id),
  refNo: varchar('ref_no', { length: 100 }),
  clientName: varchar('client_name', { length: 255 }),
  date: date('date'),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }),
  jsonData: jsonb('json_data').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const invoiceSnapshots = pgTable('invoice_snapshots', {
  id: serial('id').primaryKey(),
  invoiceId: integer('invoice_id').references(() => invoices.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  fontId: integer('font_id').references(() => fonts.id),
  jsonData: jsonb('json_data').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
