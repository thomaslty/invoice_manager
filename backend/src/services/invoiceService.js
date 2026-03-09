import { db } from '../db/index.js';
import { invoices } from '../db/schema.js';
import { eq, ilike, or, and, gte, lte, desc, asc } from 'drizzle-orm';

function extractFields(jsonData) {
  const meta = jsonData?.sections?.metadata?.fields || {};
  const categories = jsonData?.sections?.items?.categories || [];
  let grandTotal = 0;
  for (const cat of categories) {
    for (const item of cat.items || []) {
      grandTotal += Number(item.total) || 0;
    }
  }
  return {
    refNo: meta.refNo || null,
    clientName: meta.client || null,
    date: meta.date || null,
    totalAmount: String(grandTotal),
  };
}

export async function listInvoices({ search, sortBy, sortOrder, dateFrom, dateTo } = {}) {
  const conditions = [];

  if (search) {
    const pattern = `%${search}%`;
    conditions.push(or(
      ilike(invoices.refNo, pattern),
      ilike(invoices.clientName, pattern)
    ));
  }
  if (dateFrom) conditions.push(gte(invoices.date, dateFrom));
  if (dateTo) conditions.push(lte(invoices.date, dateTo));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const sortColumn = {
    date: invoices.date,
    client_name: invoices.clientName,
    total_amount: invoices.totalAmount,
    ref_no: invoices.refNo,
    created_at: invoices.createdAt,
  }[sortBy] || invoices.createdAt;

  const orderFn = sortOrder === 'asc' ? asc : desc;

  return db.select().from(invoices).where(where).orderBy(orderFn(sortColumn));
}

export async function getInvoiceById(id) {
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
  return invoice;
}

export async function createInvoice(data) {
  const extracted = extractFields(data.jsonData);
  const [invoice] = await db.insert(invoices).values({
    templateId: data.templateId || null,
    fontId: data.fontId,
    jsonData: data.jsonData,
    ...extracted,
  }).returning();
  return invoice;
}

export async function updateInvoice(id, data) {
  const updates = { ...data, updatedAt: new Date() };
  if (data.jsonData) {
    Object.assign(updates, extractFields(data.jsonData));
  }
  const [invoice] = await db.update(invoices)
    .set(updates)
    .where(eq(invoices.id, id))
    .returning();
  return invoice;
}

export async function deleteInvoice(id) {
  const [invoice] = await db.delete(invoices).where(eq(invoices.id, id)).returning();
  return invoice;
}
