import { test, expect } from '@playwright/test';
import { BASE, createInvoice, deleteInvoices, pickDate } from './helpers.js';

test.describe('Invoice date picker', () => {
  const created = [];

  test.afterAll(async ({ request }) => {
    await deleteInvoices(request, created);
  });

  test('the date control is a button, so it cannot be typed into', async ({ page }) => {
    await page.goto(`${BASE}/invoices/new`);

    const control = page.locator('#metadata-date');
    await expect(control).toHaveJSProperty('tagName', 'BUTTON');
    await expect(page.locator('input#metadata-date')).toHaveCount(0);

    // Typing at the control leaves the value alone.
    await control.focus();
    await page.keyboard.type('31 December, 1999');
    await expect(control).not.toHaveText('31 December, 1999');
  });

  test('an empty date reads "Pick a date"', async ({ page }) => {
    await page.goto(`${BASE}/invoices/new`);
    await expect(page.locator('#metadata-date')).toHaveText('Pick a date');
  });

  test('picking a day fills the field and updates the preview', async ({ page }) => {
    await page.goto(`${BASE}/invoices/new`);

    await pickDate(page, 20);

    // Formatted as "d MMMM, yyyy".
    await expect(page.locator('#metadata-date')).toHaveText(/^\d{1,2} [A-Z][a-z]+, \d{4}$/);
    const shown = await page.locator('#metadata-date').textContent();

    const iframe = page.frameLocator('iframe');
    await expect(iframe.getByText(shown.trim())).toBeVisible();
  });

  test('an existing date is preselected in the calendar', async ({ page, request }) => {
    const id = await createInvoice(request, {
      refNo: 'PICKER-001',
      client: 'Picker Client',
      date: '30 September, 2022',
    });
    created.push(id);

    await page.goto(`${BASE}/invoices/${id}/edit`);
    await expect(page.locator('#metadata-date')).toHaveText('30 September, 2022');

    await page.locator('#metadata-date').click();
    const calendar = page.locator('[data-slot="calendar"]');
    await expect(calendar).toBeVisible();

    // Opens on the month of the stored date, with that day selected.
    await expect(calendar).toContainText('September 2022');
    await expect(calendar.locator('td button[data-selected-single="true"]')).toHaveText('30');
  });

  test('the display string is stored while the sort column holds ISO', async ({ page, request }) => {
    await page.goto(`${BASE}/invoices/new`);

    await pickDate(page, 12);
    const shown = (await page.locator('#metadata-date').textContent()).trim();

    await page.getByRole('textbox', { name: 'Reference No.' }).fill('PICKER-ISO');
    await page.getByRole('textbox', { name: 'Client' }).fill('ISO Client');
    await page.getByPlaceholder('Item description').fill('Item');
    await page.locator('tbody tr:first-child td:nth-child(4) input').fill('300');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page).toHaveURL(/\/invoices\/\d+\/edit/);

    const id = Number(page.url().match(/\/invoices\/(\d+)\/edit/)[1]);
    created.push(id);

    const invoice = await (await request.get(`${BASE}/api/invoices/${id}`)).json();
    // json_data keeps what the user sees, so the PDF is unchanged.
    expect(invoice.jsonData.sections.metadata.fields.date).toBe(shown);
    // The indexed column is the ISO sort key.
    expect(invoice.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(invoice.date.endsWith('-12')).toBe(true);
  });
});
