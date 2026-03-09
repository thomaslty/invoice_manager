import * as invoiceService from '../services/invoiceService.js';
import * as pdfService from '../services/pdfService.js';
import * as previewService from '../services/previewService.js';

export async function list(req, res) {
  const { search, sort_by, sort_order, date_from, date_to } = req.query;
  const invoices = await invoiceService.listInvoices({
    search,
    sortBy: sort_by,
    sortOrder: sort_order,
    dateFrom: date_from,
    dateTo: date_to,
  });
  res.json(invoices);
}

export async function getById(req, res) {
  const invoice = await invoiceService.getInvoiceById(Number(req.params.id));
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  res.json(invoice);
}

export async function create(req, res) {
  const { templateId, fontId, jsonData } = req.body;
  if (!jsonData) return res.status(400).json({ error: 'jsonData is required' });
  const invoice = await invoiceService.createInvoice({ templateId, fontId, jsonData });
  res.status(201).json(invoice);
}

export async function update(req, res) {
  const invoice = await invoiceService.updateInvoice(Number(req.params.id), req.body);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  res.json(invoice);
}

export async function remove(req, res) {
  const invoice = await invoiceService.deleteInvoice(Number(req.params.id));
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  res.json({ success: true });
}

export async function downloadPdf(req, res) {
  const invoice = await invoiceService.getInvoiceById(Number(req.params.id));
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const html = await previewService.generatePreviewHtml(invoice.jsonData, invoice.fontId, baseUrl);
  const pdfBuffer = await pdfService.generatePdf(html);

  const filename = `invoice-${invoice.refNo || invoice.id}.pdf`;
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${filename}"`,
  });
  res.send(pdfBuffer);
}
