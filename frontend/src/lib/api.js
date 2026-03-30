const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (res.status === 401) {
    window.location.href = '/login';
    throw new Error('Authentication required');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) return res.json();
  if (contentType?.includes('text/html')) return res.text();
  return res;
}

export const api = {
  // Fonts
  getFonts: () => request('/fonts'),
  getFont: (id) => request(`/fonts/${id}`),
  createFont: (data) => request('/fonts', { method: 'POST', body: JSON.stringify(data) }),
  uploadFont: (formData) => request('/fonts/upload', { method: 'POST', body: formData, headers: {} }),
  deleteFont: (id) => request(`/fonts/${id}`, { method: 'DELETE' }),

  // Templates
  getTemplates: () => request('/templates'),
  getTemplate: (id) => request(`/templates/${id}`),
  createTemplate: (data) => request('/templates', { method: 'POST', body: JSON.stringify(data) }),
  updateTemplate: (id, data) => request(`/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTemplate: (id) => request(`/templates/${id}`, { method: 'DELETE' }),

  // Invoices
  getInvoices: (params) => request(`/invoices?${new URLSearchParams(params)}`),
  getInvoice: (id) => request(`/invoices/${id}`),
  createInvoice: (data) => request('/invoices', { method: 'POST', body: JSON.stringify(data) }),
  updateInvoice: (id, data) => request(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInvoice: (id) => request(`/invoices/${id}`, { method: 'DELETE' }),
  getInvoicePdfUrl: (id) => `/api/invoices/${id}/pdf`,

  // Snapshots
  getAllSnapshots: () => request('/snapshots'),
  getSnapshots: (invoiceId) => request(`/invoices/${invoiceId}/snapshots`),
  createSnapshot: (invoiceId, data) => request(`/invoices/${invoiceId}/snapshots`, { method: 'POST', body: JSON.stringify(data) }),
  getSnapshot: (id) => request(`/snapshots/${id}`),
  deleteSnapshot: (id) => request(`/snapshots/${id}`, { method: 'DELETE' }),
  cloneSnapshot: (id) => request(`/snapshots/${id}/clone`, { method: 'POST' }),

  // Preview
  getPreviewHtml: (data) => request('/preview', { method: 'POST', body: JSON.stringify(data) }),

  // Uploads
  uploadSignature: (formData) => request('/uploads/signature', { method: 'POST', body: formData, headers: {} }),
};
