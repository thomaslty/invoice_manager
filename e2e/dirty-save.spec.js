import { test, expect } from '@playwright/test';
import { BASE, createInvoice, deleteInvoices, saveDisabled, pickDate } from './helpers.js';

test.describe('Save is enabled only when there are changes', () => {
  const created = [];

  test.afterAll(async ({ request }) => {
    await deleteInvoices(request, created);
  });

  test('a blank new invoice cannot be saved', async ({ page }) => {
    await page.goto(`${BASE}/invoices/new`);
    expect(await saveDisabled(page)).toBe(true);
  });

  test('typing enables Save', async ({ page }) => {
    await page.goto(`${BASE}/invoices/new`);
    expect(await saveDisabled(page)).toBe(true);

    await page.getByRole('textbox', { name: 'Client' }).fill('Somebody');
    await expect.poll(() => saveDisabled(page)).toBe(false);
  });

  test('picking a date enables Save', async ({ page }) => {
    await page.goto(`${BASE}/invoices/new`);
    await pickDate(page, 10);
    await expect.poll(() => saveDisabled(page)).toBe(false);
  });

  test('an unchanged existing invoice cannot be saved', async ({ page, request }) => {
    const id = await createInvoice(request, {
      refNo: 'DIRTY-001',
      client: 'Dirty Client',
      date: '30 September, 2022',
    });
    created.push(id);

    await page.goto(`${BASE}/invoices/${id}/edit`);
    await expect(page.getByRole('textbox', { name: 'Client' })).toHaveValue('Dirty Client');
    expect(await saveDisabled(page)).toBe(true);
  });

  test('Save turns off again after a successful save', async ({ page, request }) => {
    const id = await createInvoice(request, {
      refNo: 'DIRTY-002',
      client: 'Dirty Client',
      date: '30 September, 2022',
    });
    created.push(id);

    await page.goto(`${BASE}/invoices/${id}/edit`);
    await page.getByRole('textbox', { name: 'Client' }).fill('Dirty Client Renamed');
    await expect.poll(() => saveDisabled(page)).toBe(false);

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Invoice saved').first()).toBeVisible();
    await expect.poll(() => saveDisabled(page)).toBe(true);
  });

  test('an invoice whose line items predate stable IDs still loads clean', async ({ page, request }) => {
    // ensureItemIds hands out fresh ids on load. Baselining the raw API response
    // instead of the processed form would make this invoice look edited at once.
    const id = await createInvoice(request, {
      refNo: 'DIRTY-LEGACY',
      client: 'Legacy Client',
      date: '15 June, 2021',
      description: 'No-id legacy item',
      itemIds: false,
    });
    created.push(id);

    const stored = await (await request.get(`${BASE}/api/invoices/${id}`)).json();
    expect(stored.jsonData.sections.items.categories[0].items[0].id).toBeUndefined();

    await page.goto(`${BASE}/invoices/${id}/edit`);
    await expect(page.getByPlaceholder('Item description')).toHaveValue('No-id legacy item');
    expect(await saveDisabled(page)).toBe(true);
  });

  test('a duplicate starts out saveable', async ({ page, request }) => {
    const id = await createInvoice(request, {
      refNo: 'DIRTY-SRC',
      client: 'Source Client',
      date: '30 September, 2022',
    });
    created.push(id);

    await page.goto(`${BASE}/invoices/new?from=${id}`);
    await expect(page.getByRole('textbox', { name: 'Client' })).toHaveValue('Source Client');
    expect(await saveDisabled(page)).toBe(false);
  });
});
