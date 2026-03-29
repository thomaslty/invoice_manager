import * as snapshotService from '../services/snapshotService.js';
import * as invoiceService from '../services/invoiceService.js';

export async function listByInvoice(req, res) {
  const invoiceId = Number(req.params.invoiceId);
  const invoice = await invoiceService.getInvoiceById(invoiceId, req.user.id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  const snapshots = await snapshotService.listByInvoice(invoiceId);
  res.json(snapshots);
}

export async function getById(req, res) {
  const id = Number(req.params.id);
  const owns = await snapshotService.verifySnapshotOwnership(id, req.user.id);
  if (!owns) return res.status(404).json({ error: 'Snapshot not found' });
  const snapshot = await snapshotService.getSnapshotById(id);
  if (!snapshot) return res.status(404).json({ error: 'Snapshot not found' });
  res.json(snapshot);
}

export async function create(req, res) {
  const invoiceId = Number(req.params.invoiceId);
  const invoice = await invoiceService.getInvoiceById(invoiceId, req.user.id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const snapshot = await snapshotService.createSnapshot(invoiceId, name);
  if (!snapshot) return res.status(404).json({ error: 'Invoice not found' });
  res.status(201).json(snapshot);
}

export async function remove(req, res) {
  const id = Number(req.params.id);
  const owns = await snapshotService.verifySnapshotOwnership(id, req.user.id);
  if (!owns) return res.status(404).json({ error: 'Snapshot not found' });
  const snapshot = await snapshotService.deleteSnapshot(id);
  if (!snapshot) return res.status(404).json({ error: 'Snapshot not found' });
  res.json({ success: true });
}

export async function clone(req, res) {
  const id = Number(req.params.id);
  const owns = await snapshotService.verifySnapshotOwnership(id, req.user.id);
  if (!owns) return res.status(404).json({ error: 'Snapshot not found' });
  const invoice = await snapshotService.cloneSnapshot(id, req.user.id);
  if (!invoice) return res.status(404).json({ error: 'Snapshot not found' });
  res.status(201).json(invoice);
}
