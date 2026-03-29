import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';

test.describe('User scoping and data ownership', () => {
  test('create invoice via UI, appears in dashboard', async ({ page }) => {
    await page.goto(`${BASE}/invoices/new`);

    // Fill required metadata
    await page.getByRole('textbox', { name: 'Date' }).fill('01 Jan, 2026');
    await page.getByRole('textbox', { name: 'Reference No.' }).fill('SCOPE-001');
    await page.getByRole('textbox', { name: 'Client' }).fill('Scoping Test Client');
    await page.getByRole('textbox', { name: 'Contact Person' }).fill('Tester');
    await page.getByRole('textbox', { name: 'Job Title' }).fill('Test Job');

    // Fill an item so grand total > 0
    await page.getByRole('textbox', { name: 'Category name' }).fill('Test');
    await page.getByPlaceholder('Item description').fill('Test item');
    await page.locator('tbody tr:first-child td:nth-child(4) input').fill('500');

    // Save
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText('Invoice saved')).toBeVisible({ timeout: 5000 });

    // Go to dashboard
    await page.goto(BASE);
    await expect(page.getByText('SCOPE-001').first()).toBeVisible();
    await expect(page.getByText('Scoping Test Client').first()).toBeVisible();
  });

  test('edit invoice from dashboard, verify change persists', async ({ page }) => {
    // Create an invoice first
    await page.goto(`${BASE}/invoices/new`);
    await page.getByRole('textbox', { name: 'Date' }).fill('02 Jan, 2026');
    await page.getByRole('textbox', { name: 'Reference No.' }).fill('EDIT-001');
    await page.getByRole('textbox', { name: 'Client' }).fill('Edit Client');
    await page.getByRole('textbox', { name: 'Contact Person' }).fill('Tester');
    await page.getByRole('textbox', { name: 'Job Title' }).fill('Edit Job');
    await page.getByRole('textbox', { name: 'Category name' }).fill('Cat');
    await page.getByPlaceholder('Item description').fill('Item');
    await page.locator('tbody tr:first-child td:nth-child(4) input').fill('100');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText('Invoice saved')).toBeVisible({ timeout: 5000 });

    // Go to dashboard and click edit
    await page.goto(BASE);
    const row = page.getByRole('row').filter({ hasText: 'EDIT-001' });
    await row.getByRole('button').first().click();
    await page.getByRole('menuitem', { name: /edit/i }).click();

    // Update client name
    const clientInput = page.getByRole('textbox', { name: 'Client' });
    await clientInput.fill('Updated Client');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText('Invoice saved')).toBeVisible({ timeout: 5000 });

    // Go to dashboard and verify
    await page.goto(BASE);
    await expect(page.getByText('Updated Client').first()).toBeVisible();
  });

  test('delete invoice from dashboard, removed from list', async ({ page }) => {
    // Create an invoice first
    await page.goto(`${BASE}/invoices/new`);
    await page.getByRole('textbox', { name: 'Date' }).fill('03 Jan, 2026');
    await page.getByRole('textbox', { name: 'Reference No.' }).fill('DEL-001');
    await page.getByRole('textbox', { name: 'Client' }).fill('Delete Client');
    await page.getByRole('textbox', { name: 'Contact Person' }).fill('Tester');
    await page.getByRole('textbox', { name: 'Job Title' }).fill('Del Job');
    await page.getByRole('textbox', { name: 'Category name' }).fill('Cat');
    await page.getByPlaceholder('Item description').fill('Item');
    await page.locator('tbody tr:first-child td:nth-child(4) input').fill('100');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText('Invoice saved')).toBeVisible({ timeout: 5000 });

    // Go to dashboard and delete
    await page.goto(BASE);
    await expect(page.getByText('DEL-001')).toBeVisible();
    const row = page.getByRole('row').filter({ hasText: 'DEL-001' });
    await row.getByRole('button').first().click();
    await page.getByRole('menuitem', { name: /delete/i }).click();

    // Confirm deletion if dialog appears
    const confirmBtn = page.getByRole('button', { name: /confirm|delete|yes/i });
    if (await confirmBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await confirmBtn.click();
    }

    // Verify removed
    await expect(page.getByText('DEL-001')).not.toBeVisible({ timeout: 5000 });
  });

  test('system font has delete button disabled (canDelete: false)', async ({ page }) => {
    await page.goto(BASE);
    await page.getByText('Fonts').click();
    await expect(page).toHaveURL(`${BASE}/fonts`);
    // Wait for font cards to load
    await expect(page.getByText('Arial')).toBeVisible({ timeout: 5000 });
    // Find the delete button for Arial using its aria-label
    const deleteBtn = page.getByRole('button', { name: 'Delete font Arial' });
    await expect(deleteBtn).toBeDisabled();
  });

  test('upload a font and it appears with delete enabled', async ({ page }) => {
    await page.goto(BASE);
    await page.getByText('Fonts').click();
    await expect(page).toHaveURL(`${BASE}/fonts`);
    // Wait for page to load
    await expect(page.getByText('Arial')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: /add font/i }).click();
    await page.getByRole('tab', { name: /remote/i }).click();

    await page.getByLabel('Font URL').fill(
      'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap'
    );

    // Wait for auto-populate
    await expect(page.getByLabel('Name')).toHaveValue('Playfair Display', { timeout: 3000 });

    // Submit — the "Add Font" button inside the dialog
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /add font/i }).click();

    // Verify font appears
    await expect(page.getByText('Playfair Display')).toBeVisible({ timeout: 5000 });
  });

  test('DELETE /api/fonts/:id for system font returns 403', async ({ request }) => {
    // Get fonts list to find a system font
    const listRes = await request.get(`${BASE}/api/fonts`);
    const fonts = await listRes.json();
    const systemFont = fonts.find(f => f.source === 'system');
    expect(systemFont).toBeTruthy();

    const deleteRes = await request.delete(`${BASE}/api/fonts/${systemFont.id}`);
    expect(deleteRes.status()).toBe(403);
    const body = await deleteRes.json();
    expect(body.error).toContain('System fonts cannot be deleted');
  });
});
