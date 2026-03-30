import { db } from '../db/index.js';
import { invoices } from '../db/schema.js';
import { eq, ilike, or, and, gte, lte, desc, asc, count } from 'drizzle-orm';

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

export async function listInvoices({ userId, search, sortBy, sortOrder, dateFrom, dateTo, page = 1, limit = 20 } = {}) {
  const conditions = [eq(invoices.userId, userId)];

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
  const offset = (page - 1) * limit;

  const [data, [{ total }]] = await Promise.all([
    db.select().from(invoices).where(where).orderBy(orderFn(sortColumn)).limit(limit).offset(offset),
    db.select({ total: count() }).from(invoices).where(where),
  ]);

  return { data, total };
}

export async function getInvoiceById(id, userId) {
  const [invoice] = await db.select().from(invoices).where(and(eq(invoices.id, id), eq(invoices.userId, userId)));
  return invoice;
}

export async function createInvoice(data, userId) {
  const extracted = extractFields(data.jsonData);
  const [invoice] = await db.insert(invoices).values({
    userId,
    templateId: data.templateId || null,
    fontId: data.fontId,
    jsonData: data.jsonData,
    ...extracted,
  }).returning();
  return invoice;
}

export async function updateInvoice(id, data, userId) {
  const updates = { ...data, updatedAt: new Date() };
  if (data.jsonData) {
    Object.assign(updates, extractFields(data.jsonData));
  }
  const [invoice] = await db.update(invoices)
    .set(updates)
    .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
    .returning();
  return invoice;
}

export async function deleteInvoice(id, userId) {
  const [invoice] = await db.delete(invoices).where(and(eq(invoices.id, id), eq(invoices.userId, userId))).returning();
  return invoice;
}
