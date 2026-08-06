import { expect } from '@playwright/test';

export const BASE = 'http://localhost:5173';

/**
 * Pick a date using the DatePicker calendar popover.
 * Opens the calendar, selects the given day from the currently visible month,
 * and waits for the popover to close.
 *
 * @param {import('@playwright/test').Page} page
 * @param {number} [day=15] - day of month to select from the current calendar view
 */
export async function pickDate(page, day = 15) {
  await page.locator('#metadata-date').click();

  const calendar = page.locator('[data-slot="calendar"]');
  await expect(calendar).toBeVisible();

  // DayPicker renders days as <Button> inside <td> cells
  await calendar
    .locator('table td button')
    .filter({ hasText: new RegExp(`^${day}$`) })
    .first()
    .click();

  // Popover closes after date selection
  await expect(calendar).not.toBeVisible();
}

/** Build a complete invoice payload with a single line item. */
export function invoicePayload({ refNo, client, date, description = 'Work', total = 100, itemIds = true }) {
  const item = { description, qty: 1, total };
  if (itemIds) item.id = crypto.randomUUID();
  return {
    jsonData: {
      sections: {
        header: { visible: true, title: 'INVOICE' },
        metadata: {
          visible: true,
          fields: { date, refNo, client, contactPerson: '', jobTitle: '' },
        },
        items: {
          visible: true,
          currency: 'HKD',
          categories: [{ name: '', items: [item] }],
        },
        paymentMethod: { visible: true, content: 'FPS: 123456' },
        terms: { visible: true, content: 'Payment due in 30 days' },
        signature: { visible: true, label: 'For and on behalf of', imageUrl: '', name: 'Thomas Lau', title: 'Director' },
        footer: { visible: true, content: 'Thank you for your business' },
      },
    },
  };
}

/** Create an invoice through the API and return its id. */
export async function createInvoice(request, opts) {
  const res = await request.post(`${BASE}/api/invoices`, { data: invoicePayload(opts) });
  expect(res.status()).toBe(201);
  return (await res.json()).id;
}

/** Delete invoices created by a test. */
export async function deleteInvoices(request, ids) {
  for (const id of ids) {
    await request.delete(`${BASE}/api/invoices/${id}`);
  }
}

/** Read the Ref No and Date cell of every row currently rendered in the table. */
export async function tableRows(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('tbody tr')].map((tr) => {
      const cells = [...tr.querySelectorAll('td')].map((td) => td.textContent.trim());
      return { refNo: cells[0], date: cells[2] };
    })
  );
}

/** Whether the Save button is currently disabled. */
export async function saveDisabled(page) {
  return page.getByRole('button', { name: 'Save' }).isDisabled();
}
