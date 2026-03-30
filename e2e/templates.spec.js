import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';

test.describe('Templates', () => {
  test('navigate to templates via sidebar', async ({ page }) => {
    await page.goto(BASE);

    // Click Templates in sidebar
    await page.getByRole('link', { name: 'Templates' }).click();
    await expect(page.url()).toBe(`${BASE}/templates`);
    await expect(page.getByRole('heading', { name: 'Templates' })).toBeVisible();
  });

  test('create a new template and verify it appears in table', async ({ page }) => {
    await page.goto(`${BASE}/templates/new`);

    // Verify New Template heading
    await expect(page.getByRole('heading', { name: 'New Template' })).toBeVisible();

    // Fill template name
    await page.getByPlaceholder('Template name').fill('E2E Template');

    // Fill header title
    await page.locator('#header-title').clear();
    await page.locator('#header-title').fill('INVOICE TEMPLATE');
    await page.getByRole('textbox', { name: 'Details' }).fill('Bank Transfer Only');

    // Save
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Template saved').first()).toBeVisible();

    // Verify URL changed to edit mode
    await expect(page.url()).toMatch(/\/templates\/\d+\/edit/);
    await expect(page.getByRole('heading', { name: 'Edit Template' })).toBeVisible();

    // Navigate to template list and verify it appears in table
    await page.getByRole('link', { name: 'Templates' }).click();
    await expect(page.getByRole('cell', { name: 'E2E Template' }).first()).toBeVisible();
  });

  test('edit an existing template', async ({ page }) => {
    // First create a template to edit with a unique name
    const uniqueName = `Edit Template ${Date.now()}`;
    await page.goto(`${BASE}/templates/new`);
    await page.getByPlaceholder('Template name').fill(uniqueName);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Template saved').first()).toBeVisible();

    // Verify URL changed to edit mode — extract template ID for direct navigation
    await expect(page.url()).toMatch(/\/templates\/\d+\/edit/);
    const editUrl = page.url();
    const templateId = editUrl.match(/\/templates\/(\d+)\/edit/)[1];

    // Navigate directly to edit page
    await page.goto(`${BASE}/templates/${templateId}/edit`);

    // Verify editor loads with template data
    await expect(page.getByRole('heading', { name: 'Edit Template' })).toBeVisible();
    await expect(page.getByPlaceholder('Template name')).toHaveValue(uniqueName);

    // Modify template name
    const updatedName = `${uniqueName} Updated`;
    await page.getByPlaceholder('Template name').clear();
    await page.getByPlaceholder('Template name').fill(updatedName);

    // Save
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Template saved').first()).toBeVisible();

    // Verify updated name persists after reload
    await page.reload();
    await expect(page.getByPlaceholder('Template name')).toHaveValue(updatedName);
  });

  test('view template in read-only mode', async ({ page }) => {
    // Create a template first
    const uniqueName = `View Template ${Date.now()}`;
    await page.goto(`${BASE}/templates/new`);
    await page.getByPlaceholder('Template name').fill(uniqueName);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Template saved').first()).toBeVisible();

    const editUrl = page.url();
    const templateId = editUrl.match(/\/templates\/(\d+)\/edit/)[1];

    // Navigate to templates dashboard
    await page.getByRole('link', { name: 'Templates' }).click();

    // Navigate to read-only view
    await page.goto(`${BASE}/templates/${templateId}`);

    // Verify read-only viewer
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Template:');
    await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save' })).not.toBeVisible();

    // Click Edit button navigates to editor
    await page.getByRole('button', { name: 'Edit' }).click();
    await expect(page.url()).toMatch(/\/templates\/\d+\/edit/);
    await expect(page.getByRole('heading', { name: 'Edit Template' })).toBeVisible();
  });

  test('pagination controls are always visible', async ({ page }) => {
    await page.goto(`${BASE}/templates`);
    await expect(page.getByRole('heading', { name: 'Templates' })).toBeVisible();

    // Verify pagination controls are visible even with few items
    await expect(page.getByText(/Showing \d+–\d+ of \d+/)).toBeVisible();
    await expect(page.getByText('Rows')).toBeVisible();
  });

  test('search filters templates and updates URL param', async ({ page }) => {
    // Create a template with a unique name to search for
    const uniqueName = `SearchTest ${Date.now()}`;
    await page.goto(`${BASE}/templates/new`);
    await page.getByPlaceholder('Template name').fill(uniqueName);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Template saved').first()).toBeVisible();

    // Navigate to templates dashboard
    await page.goto(`${BASE}/templates`);

    // Type in search input
    await page.getByPlaceholder('Search by template name...').fill('SearchTest');

    // Wait for debounce to update URL
    await page.waitForTimeout(500);

    // Verify URL updated with search param
    await expect(page).toHaveURL(/search=SearchTest/);

    // Verify matching result is visible
    await expect(page.getByText(uniqueName).first()).toBeVisible();
  });

  test('search URL param pre-populates input and filters results', async ({ page }) => {
    // Navigate with search param pre-set
    await page.goto(`${BASE}/templates?search=E2E`);

    // Verify search input is pre-populated
    await expect(page.getByPlaceholder('Search by template name...')).toHaveValue('E2E');

    // Verify filtered results show matching templates
    await expect(page.getByText('E2E Template').first()).toBeVisible();
  });

  test('clicking column header sorts table and updates URL params', async ({ page }) => {
    await page.goto(`${BASE}/templates`);
    await expect(page.getByRole('heading', { name: 'Templates' })).toBeVisible();

    // Click Name header to sort ascending — verify URL includes sort params
    await page.locator('thead button', { hasText: 'Name' }).click();
    await expect(page).toHaveURL(/sort_by=name/);
    await expect(page).toHaveURL(/sort_order=asc/);

    // Click Last Updated header — switches sort column, resets to ascending
    await page.locator('thead button', { hasText: 'Last Updated' }).click();
    // updatedAt is the default sort_by, so it's cleaned from URL; sort_order=asc remains
    await expect(page).toHaveURL(/sort_order=asc/);
    expect(page.url()).not.toContain('sort_by=');
  });

  test('sidebar shows all four nav items', async ({ page }) => {
    await page.goto(BASE);

    await expect(page.getByRole('link', { name: 'Invoices' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Templates' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Snapshots' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Fonts' })).toBeVisible();
  });
});
