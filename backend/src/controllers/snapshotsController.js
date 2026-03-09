import * as snapshotService from '../services/snapshotService.js';

export async function listByInvoice(req, res) {
  const snapshots = await snapshotService.listByInvoice(Number(req.params.invoiceId));
  res.json(snapshots);
}

export async function getById(req, res) {
  const snapshot = await snapshotService.getSnapshotById(Number(req.params.id));
  if (!snapshot) return res.status(404).json({ error: 'Snapshot not found' });
  res.json(snapshot);
}

export async function create(req, res) {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const snapshot = await snapshotService.createSnapshot(Number(req.params.invoiceId), name);
  if (!snapshot) return res.status(404).json({ error: 'Invoice not found' });
  res.status(201).json(snapshot);
}

export async function remove(req, res) {
  const snapshot = await snapshotService.deleteSnapshot(Number(req.params.id));
  if (!snapshot) return res.status(404).json({ error: 'Snapshot not found' });
  res.json({ success: true });
}

export async function clone(req, res) {
  const invoice = await snapshotService.cloneSnapshot(Number(req.params.id));
  if (!invoice) return res.status(404).json({ error: 'Snapshot not found' });
  res.status(201).json(invoice);
}
