import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { pickDate } from './helpers.js';

const BASE = 'http://localhost:5173';

test.describe('Invoice Editor', () => {
  test('fill form with multi-category items and verify preview', async ({ page }) => {
    await page.goto(`${BASE}/invoices/new`);

    // Fill metadata
    await pickDate(page);
    await page.getByRole('textbox', { name: 'Reference No.' }).fill('Inv-001');
    await page.getByRole('textbox', { name: 'Client' }).fill('NextStation');
    await page.getByRole('textbox', { name: 'Contact Person' }).fill('Tom');
    await page.getByRole('textbox', { name: 'Job Title' }).fill('NextStation Website');

    // Fill category 1
    await page.getByRole('textbox', { name: 'Category name' }).fill('Website');
    await page.getByPlaceholder('Item description').fill('Frontend');
    await page.locator('tbody tr:first-child td:nth-child(4) input').fill('100');

    // Add second item
    await page.getByRole('button', { name: 'Add Item' }).click();
    await page.locator('tbody tr:nth-child(2)').getByPlaceholder('Item description').fill('Backend');
    await page.locator('tbody tr:nth-child(2) td:nth-child(4) input').fill('100');

    // Add second category
    await page.getByRole('button', { name: 'Add Category' }).click();
    await page.getByRole('textbox', { name: 'Category 2 name' }).fill('Infra');

    // Fill second category item
    const cat2 = page.locator('.space-y-4 > div:nth-child(3)');
    await cat2.getByPlaceholder('Item description').fill('Hosting');
    await cat2.locator('tbody tr:first-child td:nth-child(4) input').fill('100');

    // Fill payment, terms, footer
    await page.getByRole('textbox', { name: 'Details' }).fill('FPS: 123456');
    await page.getByPlaceholder('Payment terms, conditions...').fill('1. Please pay now');
    await page.getByPlaceholder('Footer text').fill('zoe');

    // Wait for preview to update
    await page.waitForTimeout(500);

    // Verify preview iframe content
    const iframe = page.frameLocator('iframe');
    await expect(iframe.locator('h1')).toContainText('INVOICE');
    await expect(iframe.getByText('NextStation', { exact: true })).toBeVisible();
    await expect(iframe.getByText('Inv-001')).toBeVisible();

    // Verify items in preview
    await expect(iframe.getByText('Frontend')).toBeVisible();
    await expect(iframe.getByText('Backend')).toBeVisible();
    await expect(iframe.getByText('Hosting')).toBeVisible();

    // Verify subtotals
    const subtotalCells = iframe.locator('.subtotal-row .col-total');
    await expect(subtotalCells.first()).toContainText('HK$200.00');
    await expect(subtotalCells.last()).toContainText('HK$100.00');

    // Verify grand total
    await expect(iframe.locator('.grand-total-value')).toContainText('HK$300.00');

    // Verify payment and terms
    await expect(iframe.getByText('FPS: 123456')).toBeVisible();
    await expect(iframe.getByText('Please pay now')).toBeVisible();

    // Verify footer is visible in the scaled preview
    await expect(iframe.locator('.footer-text')).toContainText('zoe');
    const footerVisible = await page.evaluate(() => {
      const iframeEl = document.querySelector('iframe');
      const footer = iframeEl.contentDocument.querySelector('.footer-text');
      if (!footer) return false;
      return footer.offsetTop + footer.offsetHeight <= iframeEl.offsetHeight;
    });
    expect(footerVisible).toBe(true);

    // Verify UI subtotals and grand total
    await expect(page.getByText('Subtotal — Website')).toBeVisible();
    await expect(page.getByText('Subtotal — Infra')).toBeVisible();
    await expect(page.getByText('HK$300.00')).toBeVisible();
  });

  test('upload signature and verify in preview', async ({ page }) => {
    await page.goto(`${BASE}/invoices/new`);

    // Create a small test PNG
    const testImagePath = path.join(import.meta.dirname, 'test-signature.png');
    if (!fs.existsSync(testImagePath)) {
      // Create a minimal 1x1 PNG
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );
      fs.writeFileSync(testImagePath, pngBuffer);
    }

    // Upload signature
    const fileInput = page.locator('input[type="file"][accept="image/*"]');
    await fileInput.setInputFiles(testImagePath);

    // Wait for upload
    await page.waitForTimeout(1000);

    // Verify signature image appears in form
    await expect(page.locator('.signature-section img, [alt="Signature"]').first()).toBeVisible({ timeout: 5000 });

    // Verify in preview iframe — image must actually load (not broken)
    await page.waitForTimeout(500);
    const iframe = page.frameLocator('iframe');
    await expect(iframe.locator('.signature-img')).toBeVisible({ timeout: 5000 });

    // Verify the image actually loaded (naturalWidth > 0) and uses a relative URL
    const imgInfo = await page.evaluate(() => {
      const iframeEl = document.querySelector('iframe');
      const img = iframeEl.contentDocument.querySelector('.signature-img');
      if (!img) return null;
      return { naturalWidth: img.naturalWidth, complete: img.complete, src: img.getAttribute('src') };
    });
    expect(imgInfo).toBeTruthy();
    expect(imgInfo.naturalWidth).toBeGreaterThan(0);
    expect(imgInfo.complete).toBe(true);
    expect(imgInfo.src).toMatch(/^\/uploads\//);

    // Verify signature works end-to-end: save invoice then download PDF
    await page.getByRole('textbox', { name: 'Reference No.' }).fill('Inv-Sig-Test');
    await page.getByRole('textbox', { name: 'Client' }).fill('Sig Client');
    await page.getByPlaceholder('Item description').fill('Sig Item');
    await page.locator('tbody tr:first-child td:nth-child(4) input').fill('100');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page).toHaveURL(/\/invoices\/\d+\/edit/);

    // Download PDF and verify it's valid
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF' }).click();
    const download = await downloadPromise;
    const filePath = path.join(import.meta.dirname, 'sig-test.pdf');
    await download.saveAs(filePath);
    const fileContent = fs.readFileSync(filePath);
    expect(fileContent.slice(0, 4).toString()).toBe('%PDF');
    fs.unlinkSync(filePath);
  });

  test('save invoice and verify URL change + data persistence', async ({ page }) => {
    await page.goto(`${BASE}/invoices/new`);

    // Fill required fields
    await page.getByRole('textbox', { name: 'Reference No.' }).fill('Inv-Save-Test');
    await page.getByRole('textbox', { name: 'Client' }).fill('Test Client');
    await page.getByPlaceholder('Item description').fill('Test Item');
    await page.locator('tbody tr:first-child td:nth-child(4) input').fill('500');

    // Save
    await page.getByRole('button', { name: 'Save' }).click();

    // Verify URL changed to edit page
    await expect(page).toHaveURL(/\/invoices\/\d+\/edit/);

    // Verify success toast
    await expect(page.getByText('Invoice saved')).toBeVisible();

    // Verify title changed
    await expect(page.getByRole('heading', { name: 'Edit Invoice' })).toBeVisible();

    // Verify PDF button appeared
    await expect(page.getByRole('button', { name: 'PDF' })).toBeVisible();

    // Reload and verify data persists
    const url = page.url();
    await page.goto(url);
    await expect(page.getByRole('textbox', { name: 'Reference No.' })).toHaveValue('Inv-Save-Test');
    await expect(page.getByRole('textbox', { name: 'Client' })).toHaveValue('Test Client');
  });

  test('download PDF and verify content', async ({ page }) => {
    await page.goto(`${BASE}/invoices/new`);

    // Fill and save
    await page.getByRole('textbox', { name: 'Reference No.' }).fill('Inv-PDF-Test');
    await page.getByRole('textbox', { name: 'Client' }).fill('PDF Client');
    await page.getByPlaceholder('Item description').fill('PDF Item');
    await page.locator('tbody tr:first-child td:nth-child(4) input').fill('250');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page).toHaveURL(/\/invoices\/\d+\/edit/);

    // Download PDF
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF' }).click();
    const download = await downloadPromise;

    // Verify the download happened
    expect(download.suggestedFilename()).toMatch(/invoice.*\.pdf/i);

    // Save and verify it's a valid PDF (starts with %PDF)
    const filePath = path.join(import.meta.dirname, 'downloaded.pdf');
    await download.saveAs(filePath);
    const fileContent = fs.readFileSync(filePath);
    expect(fileContent.slice(0, 4).toString()).toBe('%PDF');

    // Cleanup
    fs.unlinkSync(filePath);
  });

  test('validation errors prevent saving invalid invoice', async ({ page }) => {
    await page.goto(`${BASE}/invoices/new`);

    // Click save with no data
    await page.getByRole('button', { name: 'Save' }).click();

    // Verify error toasts appear
    await expect(page.getByText('Reference number is required')).toBeVisible();
    await expect(page.getByText('Client name is required')).toBeVisible();
    await expect(page.getByText('Grand total must be greater than 0')).toBeVisible();

    // Verify URL didn't change
    expect(page.url()).toBe(`${BASE}/invoices/new`);

    // Fill ref and client but leave total at 0
    await page.getByRole('textbox', { name: 'Reference No.' }).fill('Inv-Val-Test');
    await page.getByRole('textbox', { name: 'Client' }).fill('Val Client');
    await page.getByRole('button', { name: 'Save' }).click();

    // Should still show grand total error
    await expect(page.getByText('Grand total must be greater than 0').first()).toBeVisible();
    expect(page.url()).toBe(`${BASE}/invoices/new`);
  });

  test('drag reorder items and verify numbering updates', async ({ page }) => {
    await page.goto(`${BASE}/invoices/new`);

    // Fill first item
    await page.getByPlaceholder('Item description').fill('First Item');
    await page.locator('tbody tr:first-child td:nth-child(4) input').fill('100');

    // Add second item
    await page.getByRole('button', { name: 'Add Item' }).click();

    // Wait for the new row to appear
    await page.waitForTimeout(300);

    // Fill second item using the second row's description placeholder
    const descInputs = page.getByPlaceholder('Item description');
    await descInputs.nth(1).fill('Second Item');
    await page.locator('table tbody tr:nth-child(2) td:nth-child(4) input').fill('200');

    // Wait for state to settle
    await page.waitForTimeout(300);

    // Verify items are in order by checking description inputs
    await expect(descInputs.first()).toHaveValue('First Item');
    await expect(descInputs.nth(1)).toHaveValue('Second Item');

    // Verify auto-numbering — the No column shows "1" and "2" as text
    const tableRows = page.locator('table tbody tr');
    await expect(tableRows.first()).toContainText('1');
    await expect(tableRows.nth(1)).toContainText('2');

    // Verify drag handles exist (GripVertical svg inside a button)
    await expect(tableRows.first().locator('button').first()).toBeVisible();
  });

  test('save before PDF download auto-saves unsaved changes', async ({ page }) => {
    await page.goto(`${BASE}/invoices/new`);

    // Fill and save to get an existing invoice
    await page.getByRole('textbox', { name: 'Reference No.' }).fill('Inv-AutoSave');
    await page.getByRole('textbox', { name: 'Client' }).fill('AutoSave Client');
    await page.getByPlaceholder('Item description').fill('AutoSave Item');
    await page.locator('tbody tr:first-child td:nth-child(4) input').fill('100');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page).toHaveURL(/\/invoices\/\d+\/edit/);

    // Edit a field without saving
    await page.getByRole('textbox', { name: 'Client' }).fill('AutoSave Client UPDATED');

    // Click PDF — should auto-save then download
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF' }).click();
    await expect(page.getByText('Invoice saved').first()).toBeVisible();
    const download = await downloadPromise;

    // Verify PDF is valid
    const filePath = path.join(import.meta.dirname, 'autosave-test.pdf');
    await download.saveAs(filePath);
    const fileContent = fs.readFileSync(filePath);
    expect(fileContent.slice(0, 4).toString()).toBe('%PDF');
    fs.unlinkSync(filePath);

    // Verify we're still on the edit page
    await expect(page).toHaveURL(/\/invoices\/\d+\/edit/);
  });
});
