import { test, expect } from '@playwright/test';
import { BASE, createInvoice, deleteInvoices, saveDisabled } from './helpers.js';

test.describe('View mode and Duplicate', () => {
  let sourceId;
  const created = [];

  // One source invoice for the whole file: a per-test one would leave several
  // rows sharing a reference number, and the row lookups below would be ambiguous.
  test.beforeAll(async ({ request }) => {
    sourceId = await createInvoice(request, {
      refNo: 'VIEW-SRC',
      client: 'Viewer Client',
      date: '30 September, 2022',
      description: 'Original work',
      total: 2500,
    });
    created.push(sourceId);
  });

  /** The actions trigger for the seeded source invoice. */
  function sourceActions(page) {
    return page.getByRole('row').filter({ hasText: 'VIEW-SRC' }).first().getByRole('button', { name: 'Actions' });
  }

  test.afterAll(async ({ request }) => {
    await deleteInvoices(request, created);
  });

  test('the dropdown offers View, Edit and Duplicate', async ({ page }) => {
    await page.goto(BASE);
    await sourceActions(page).click();

    const menu = page.getByRole('menu');
    await expect(menu.getByRole('menuitem', { name: 'View' })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Edit' })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Duplicate' })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Download PDF' })).toBeVisible();
  });

  test('view mode renders the invoice but nothing can be edited', async ({ page }) => {
    await page.goto(`${BASE}/invoices/${sourceId}/view`);

    await expect(page.getByRole('heading', { name: 'View Invoice' })).toBeVisible();

    // Every text field is read-only.
    await expect(page.getByRole('textbox', { name: 'Reference No.' })).toHaveAttribute('readonly', '');
    await expect(page.getByRole('textbox', { name: 'Client' })).toHaveAttribute('readonly', '');
    await expect(page.getByRole('textbox', { name: 'Date' })).toHaveAttribute('readonly', '');

    // Editing affordances are hidden.
    await expect(page.getByRole('switch')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Add Item' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Add Category' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Save' })).toHaveCount(0);
    await expect(page.getByText('Font', { exact: true })).toHaveCount(0);
    await expect(page.locator('[aria-roledescription="sortable"]')).toHaveCount(0);

    // Line items still show their values, as plain text.
    await expect(page.getByRole('cell', { name: 'Original work' })).toBeVisible();

    // The preview renders the same invoice.
    const iframe = page.frameLocator('iframe');
    await expect(iframe.getByText('VIEW-SRC')).toBeVisible();
    await expect(iframe.getByText('30 September, 2022')).toBeVisible();
  });

  test('view mode links to Edit and Duplicate', async ({ page }) => {
    await page.goto(`${BASE}/invoices/${sourceId}/view`);

    await page.getByRole('button', { name: 'Edit' }).click();
    await expect(page).toHaveURL(`${BASE}/invoices/${sourceId}/edit`);

    await page.goto(`${BASE}/invoices/${sourceId}/view`);
    await page.getByRole('button', { name: 'Duplicate' }).click();
    await expect(page).toHaveURL(`${BASE}/invoices/new?from=${sourceId}`);
  });

  test('a duplicate copies everything except the reference number and date', async ({ page }) => {
    await page.goto(BASE);
    await sourceActions(page).click();
    await page.getByRole('menuitem', { name: 'Duplicate' }).click();

    await expect(page).toHaveURL(`${BASE}/invoices/new?from=${sourceId}`);
    await expect(page.getByRole('heading', { name: 'New Invoice' })).toBeVisible();

    // Cleared.
    await expect(page.getByRole('textbox', { name: 'Reference No.' })).toHaveValue('');
    await expect(page.locator('#metadata-date')).toHaveText('Pick a date');

    // Carried over.
    await expect(page.getByRole('textbox', { name: 'Client' })).toHaveValue('Viewer Client');
    await expect(page.getByPlaceholder('Item description')).toHaveValue('Original work');
    await expect(page.getByRole('textbox', { name: 'Details' })).toHaveValue('FPS: 123456');

    // Unsaved work, so Save is available straight away.
    expect(await saveDisabled(page)).toBe(false);
  });

  test('saving a duplicate creates a second invoice and leaves the original alone', async ({ page, request }) => {
    await page.goto(`${BASE}/invoices/new?from=${sourceId}`);

    await page.getByRole('textbox', { name: 'Reference No.' }).fill('VIEW-DUP');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page).toHaveURL(/\/invoices\/\d+\/edit/);
    const dupId = Number(page.url().match(/\/invoices\/(\d+)\/edit/)[1]);
    created.push(dupId);
    expect(dupId).not.toBe(sourceId);

    // The source is untouched.
    const source = await (await request.get(`${BASE}/api/invoices/${sourceId}`)).json();
    expect(source.refNo).toBe('VIEW-SRC');
    expect(source.jsonData.sections.metadata.fields.date).toBe('30 September, 2022');

    // Both are listed.
    await page.goto(BASE);
    await expect(page.getByText('VIEW-SRC')).toBeVisible();
    await expect(page.getByText('VIEW-DUP')).toBeVisible();
  });
});
