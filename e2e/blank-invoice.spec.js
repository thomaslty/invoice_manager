import { test, expect } from '@playwright/test';
import { BASE, saveDisabled } from './helpers.js';

test.describe('New invoices always start blank', () => {
  test('New Invoice opens the editor with no template step', async ({ page }) => {
    await page.goto(BASE);

    await page.getByRole('button', { name: 'New Invoice' }).click();

    await expect(page).toHaveURL(`${BASE}/invoices/new`);
    await expect(page.getByRole('heading', { name: 'New Invoice' })).toBeVisible();

    // The old flow opened a "Choose a Template" dialog first.
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText('Choose a Template')).toHaveCount(0);
    await expect(page.getByText('Blank Invoice')).toHaveCount(0);
  });

  test('the blank editor is empty and cannot be saved yet', async ({ page }) => {
    await page.goto(`${BASE}/invoices/new`);

    await expect(page.getByRole('textbox', { name: 'Reference No.' })).toHaveValue('');
    await expect(page.getByRole('textbox', { name: 'Client' })).toHaveValue('');
    await expect(page.locator('#metadata-date')).toHaveText('Pick a date');

    expect(await saveDisabled(page)).toBe(true);
  });

  test('the sidebar offers only Invoices and Fonts', async ({ page }) => {
    await page.goto(BASE);

    const navLinks = page.locator('[data-slot="sidebar"] a');
    await expect(navLinks).toHaveText(['Invoices', 'Fonts']);
    await expect(page.getByRole('link', { name: 'Templates' })).toHaveCount(0);
  });

  test('the templates API is gone', async ({ request }) => {
    const res = await request.get(`${BASE}/api/templates`);
    expect(res.status()).toBe(404);
  });

  test('the templates page no longer renders', async ({ page }) => {
    await page.goto(`${BASE}/templates`);
    await expect(page.getByRole('heading', { name: 'Templates' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'New Template' })).toHaveCount(0);
  });
});
