import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';

test.describe('Snapshots', () => {
  test('save snapshot from invoice actions and view in dashboard', async ({ page }) => {
    // Navigate to invoices with search to find Inv-001
    await page.goto(`${BASE}/?search=Inv-001`);
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible();

    // Find the invoice and open its actions
    const row = page.getByRole('row', { name: /Inv-001/ }).first();
    await row.getByRole('button').first().click();

    // Click Save as Snapshot
    await page.getByRole('menuitem', { name: 'Save as Snapshot' }).click();

    // Fill snapshot name and save
    await page.getByPlaceholder('e.g. v1.0, Final Draft').fill('E2E Snapshot');
    await page.getByRole('button', { name: 'Save Snapshot' }).click();

    // Verify toast
    await expect(page.getByText('Snapshot saved')).toBeVisible();

    // Navigate to snapshots dashboard
    await page.getByRole('link', { name: 'Snapshots' }).click();
    await expect(page.getByRole('heading', { name: 'Snapshots' })).toBeVisible();

    // Verify snapshot appears in grouped table
    // Group header shows "Inv-001 — ClientName" and snapshot sub-row shows name
    await expect(page.getByText('E2E Snapshot').first()).toBeVisible();
    await expect(page.getByText('Inv-001').first()).toBeVisible();
  });

  test('view snapshot in read-only viewer', async ({ page }) => {
    // Navigate to snapshots dashboard
    await page.goto(`${BASE}/snapshots`);
    await expect(page.getByRole('heading', { name: 'Snapshots' })).toBeVisible();

    // Open actions on the first snapshot sub-row
    await page.getByRole('button', { name: 'Actions' }).first().click();
    await page.getByRole('menuitem', { name: 'View' }).click();

    // Verify we're on the snapshot viewer
    await expect(page.url()).toMatch(/\/snapshots\/\d+/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Snapshot:');

    // Verify Clone to Invoice button exists and no Save button
    await expect(page.getByRole('button', { name: 'Clone to Invoice' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save' })).not.toBeVisible();

    // Verify no section toggle switches (readOnly hides them)
    await expect(page.locator('button[role="switch"]')).toHaveCount(0);

    // Verify no Add Item or Add Category buttons
    await expect(page.getByRole('button', { name: 'Add Item' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Add Category' })).not.toBeVisible();

    // Verify preview iframe loads
    await expect(page.frameLocator('iframe').locator('h1')).toBeVisible();
  });

  test('clone snapshot to new invoice', async ({ page }) => {
    // Navigate to snapshots dashboard
    await page.goto(`${BASE}/snapshots`);
    await expect(page.getByRole('heading', { name: 'Snapshots' })).toBeVisible();

    // Clone the first snapshot
    await page.getByRole('button', { name: 'Actions' }).first().click();
    await page.getByRole('menuitem', { name: 'Clone to Invoice' }).click();

    // Verify toast and navigation to invoice editor
    await expect(page.getByText('Invoice created from snapshot')).toBeVisible();
    await expect(page.url()).toMatch(/\/invoices\/\d+\/edit/);
    await expect(page.getByRole('heading', { name: 'Edit Invoice' })).toBeVisible();

    // Verify Save button exists (editable invoice)
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
  });

  test('delete snapshot with confirmation', async ({ page }) => {
    // First create a snapshot to delete
    await page.goto(`${BASE}/?search=Inv-001`);
    const row = page.getByRole('row', { name: /Inv-001/ }).first();
    await row.getByRole('button').first().click();
    await page.getByRole('menuitem', { name: 'Save as Snapshot' }).click();
    await page.getByPlaceholder('e.g. v1.0, Final Draft').fill('To Delete');
    await page.getByRole('button', { name: 'Save Snapshot' }).click();
    await expect(page.getByText('Snapshot saved')).toBeVisible();

    // Navigate to snapshots dashboard
    await page.getByRole('link', { name: 'Snapshots' }).click();
    await expect(page.getByText('To Delete')).toBeVisible();

    // Open actions on "To Delete" snapshot row and click Delete
    const deleteRow = page.getByRole('row').filter({ hasText: 'To Delete' });
    await deleteRow.getByRole('button', { name: 'Actions' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();

    // Confirm deletion
    await expect(page.getByRole('heading', { name: 'Delete Snapshot' })).toBeVisible();
    await page.getByRole('button', { name: 'Delete' }).click();

    // Verify toast and row removed
    await expect(page.getByText('Snapshot deleted')).toBeVisible();
    await expect(page.getByText('To Delete')).not.toBeVisible();
  });

  test('pagination controls are always visible', async ({ page }) => {
    await page.goto(`${BASE}/snapshots`);
    await expect(page.getByRole('heading', { name: 'Snapshots' })).toBeVisible();

    // Verify pagination controls are visible even with few items
    await expect(page.getByText(/Showing \d+–\d+ of \d+/)).toBeVisible();
    await expect(page.getByText('Rows', { exact: true })).toBeVisible();
  });

  test('search filters snapshots and updates URL', async ({ page }) => {
    await page.goto(`${BASE}/snapshots`);
    await expect(page.getByRole('heading', { name: 'Snapshots' })).toBeVisible();

    // Type in search input
    await page.getByPlaceholder('Search by snapshot name, invoice ref, or client...').fill('E2E');

    // Wait for debounce to update URL
    await page.waitForTimeout(500);

    // Verify URL updated with search param
    await expect(page).toHaveURL(/search=E2E/);

    // Verify matching results are visible
    await expect(page.getByText('E2E Snapshot').first()).toBeVisible();
  });

  test('clicking column header sorts table and updates URL params', async ({ page }) => {
    await page.goto(`${BASE}/snapshots`);
    await expect(page.getByRole('heading', { name: 'Snapshots' })).toBeVisible();

    // Click Name header to sort ascending — verify URL includes sort params
    await page.locator('thead button', { hasText: 'Name' }).click();
    await expect(page).toHaveURL(/sort_by=name/);
    await expect(page).toHaveURL(/sort_order=asc/);

    // Click Created header — switches sort column, resets to ascending
    await page.locator('thead button', { hasText: 'Created' }).click();
    // createdAt is the default sort_by, so it's cleaned from URL; sort_order=asc remains
    await expect(page).toHaveURL(/sort_order=asc/);
    expect(page.url()).not.toContain('sort_by=');
  });

  test('invoice query param filters to specific invoice group', async ({ page }) => {
    // Navigate from invoice dashboard using View Snapshots action
    await page.goto(`${BASE}/?search=Inv-001`);
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible();

    const row = page.getByRole('row', { name: /Inv-001/ }).first();
    await row.getByRole('button').first().click();
    await page.getByRole('menuitem', { name: 'View Snapshots' }).click();

    // Verify redirected to snapshots with invoice filter
    await expect(page).toHaveURL(/\/snapshots\?invoice=\d+/);
    await expect(page.getByRole('heading', { name: 'Snapshots' })).toBeVisible();

    // Verify filter badge is visible
    await expect(page.getByText('Filtered by invoice')).toBeVisible();

    // Clear filter
    await page.getByText('Filtered by invoice').click();
    await expect(page.getByText('Filtered by invoice')).not.toBeVisible();
  });
});
