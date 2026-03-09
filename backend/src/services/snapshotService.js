import { db } from '../db/index.js';
import { invoiceSnapshots, invoices } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export async function listByInvoice(invoiceId) {
  return db.select().from(invoiceSnapshots)
    .where(eq(invoiceSnapshots.invoiceId, invoiceId))
    .orderBy(invoiceSnapshots.createdAt);
}

export async function getSnapshotById(id) {
  const [snapshot] = await db.select().from(invoiceSnapshots).where(eq(invoiceSnapshots.id, id));
  return snapshot;
}

export async function createSnapshot(invoiceId, name) {
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
  if (!invoice) return null;

  const [snapshot] = await db.insert(invoiceSnapshots).values({
    invoiceId,
    name,
    fontId: invoice.fontId,
    jsonData: invoice.jsonData,
  }).returning();
  return snapshot;
}

export async function deleteSnapshot(id) {
  const [snapshot] = await db.delete(invoiceSnapshots).where(eq(invoiceSnapshots.id, id)).returning();
  return snapshot;
}

export async function cloneSnapshot(snapshotId) {
  const snapshot = await getSnapshotById(snapshotId);
  if (!snapshot) return null;

  const [invoice] = await db.insert(invoices).values({
    fontId: snapshot.fontId,
    jsonData: snapshot.jsonData,
    refNo: snapshot.jsonData?.sections?.metadata?.fields?.refNo || null,
    clientName: snapshot.jsonData?.sections?.metadata?.fields?.client || null,
  }).returning();
  return invoice;
}
