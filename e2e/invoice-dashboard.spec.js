import { test, expect } from '@playwright/test';
import { pickDate } from './helpers.js';

const BASE = 'http://localhost:5173';

test.describe('Invoice Dashboard', () => {
  test('view action navigates to read-only invoice page', async ({ page }) => {
    // Create an invoice first
    await page.goto(`${BASE}/invoices/new`);
    await pickDate(page);
    await page.getByRole('textbox', { name: 'Reference No.' }).fill('DASH-VIEW-001');
    await page.getByRole('textbox', { name: 'Client' }).fill('Dashboard Client');
    await page.getByPlaceholder('Item description').fill('Item');
    await page.locator('tbody tr:first-child td:nth-child(4) input').fill('100');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page).toHaveURL(/\/invoices\/\d+\/edit/);

    // Go to dashboard with search to find the invoice
    await page.goto(`${BASE}/?search=DASH-VIEW-001`);
    const row = page.getByRole('row', { name: /DASH-VIEW-001/ }).first();
    await row.getByRole('button').first().click();

    // Click View
    await page.getByRole('menuitem', { name: 'View', exact: true }).click();

    // Verify read-only page
    await expect(page).toHaveURL(/\/invoices\/\d+$/);
    await expect(page.getByRole('heading', { name: 'View Invoice' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save' })).not.toBeVisible();

    // Click Edit navigates to editor
    await page.getByRole('button', { name: 'Edit' }).click();
    await expect(page).toHaveURL(/\/invoices\/\d+\/edit/);
    await expect(page.getByRole('heading', { name: 'Edit Invoice' })).toBeVisible();
  });

  test('view snapshots redirects to snapshots page with invoice filter', async ({ page }) => {
    // Create an invoice first
    await page.goto(`${BASE}/invoices/new`);
    await page.getByRole('textbox', { name: 'Reference No.' }).fill('DASH-SNAP-001');
    await page.getByRole('textbox', { name: 'Client' }).fill('Snap Client');
    await page.getByPlaceholder('Item description').fill('Item');
    await page.locator('tbody tr:first-child td:nth-child(4) input').fill('100');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page).toHaveURL(/\/invoices\/\d+\/edit/);

    // Go to dashboard with search to find the invoice
    await page.goto(`${BASE}/?search=DASH-SNAP-001`);
    const row = page.getByRole('row', { name: /DASH-SNAP-001/ }).first();
    await row.getByRole('button').first().click();

    // Click View Snapshots
    await page.getByRole('menuitem', { name: 'View Snapshots' }).click();

    // Verify redirected to snapshots with invoice filter param
    await expect(page).toHaveURL(/\/snapshots\?invoice=\d+/);
    await expect(page.getByRole('heading', { name: 'Snapshots' })).toBeVisible();
  });

  test('date picker selects date and shows formatted value', async ({ page }) => {
    await page.goto(`${BASE}/invoices/new`);

    // Open calendar and pick day 15
    await pickDate(page, 15);

    // Verify the date button no longer shows placeholder
    const dateBtn = page.locator('#metadata-date');
    await expect(dateBtn).not.toContainText('Pick a date');
    // Should contain a formatted date with day 15
    await expect(dateBtn).toContainText('15');

    // Wait for preview to update and verify date appears
    await page.waitForTimeout(500);
    const iframe = page.frameLocator('iframe');
    await expect(iframe.locator('.meta-value').first()).toBeVisible();
  });

  test('URL params pre-populate search filter', async ({ page }) => {
    // Create an invoice to search for
    await page.goto(`${BASE}/invoices/new`);
    await page.getByRole('textbox', { name: 'Reference No.' }).fill('URL-TEST-001');
    await page.getByRole('textbox', { name: 'Client' }).fill('URL Client');
    await page.getByPlaceholder('Item description').fill('Item');
    await page.locator('tbody tr:first-child td:nth-child(4) input').fill('100');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page).toHaveURL(/\/invoices\/\d+\/edit/);

    // Navigate to dashboard with search param pre-set
    await page.goto(`${BASE}/?search=URL-TEST`);

    // Verify search input is pre-populated
    const searchInput = page.getByPlaceholder('Search by reference or client...');
    await expect(searchInput).toHaveValue('URL-TEST');

    // Verify filtered results
    await expect(page.getByText('URL-TEST-001').first()).toBeVisible();
  });

  test('pagination controls are always visible', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible();

    // Verify pagination controls are visible
    await expect(page.getByText(/Showing \d+–\d+ of \d+/)).toBeVisible();
    await expect(page.getByText('Rows')).toBeVisible();
  });

  test('URL params pre-populate sort order', async ({ page }) => {
    // Navigate with sort params
    await page.goto(`${BASE}/?sort_by=ref_no&sort_order=asc`);

    // Verify table loads (heading visible)
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible();

    // Wait for data to load
    await page.waitForTimeout(500);

    // Verify URL retained sort params
    expect(page.url()).toContain('sort_by=ref_no');
    expect(page.url()).toContain('sort_order=asc');
  });
});
