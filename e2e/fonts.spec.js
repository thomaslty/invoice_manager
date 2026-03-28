import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';

test.describe('Fonts Page', () => {
  test('Google Fonts URL auto-populates name and family fields', async ({ page }) => {
    // Navigate to home first, then to fonts via SPA navigation
    await page.goto(BASE);
    await page.getByText('Fonts').click();
    await expect(page).toHaveURL(`${BASE}/fonts`);

    // Open the Add Font dialog
    await page.getByRole('button', { name: /add font/i }).click();

    // Switch to Remote URL tab
    await page.getByRole('tab', { name: /remote/i }).click();

    // Verify Name and Family fields are empty
    const nameInput = page.getByLabel('Name');
    const familyInput = page.getByLabel('Family');
    await expect(nameInput).toHaveValue('');
    await expect(familyInput).toHaveValue('');

    // Paste a Google Fonts URL
    const fontUrlInput = page.getByLabel('Font URL');
    await fontUrlInput.fill(
      'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap'
    );

    // Verify Name and Family were auto-populated
    await expect(nameInput).toHaveValue('Playfair Display');
    await expect(familyInput).toHaveValue('Playfair Display');
  });

  test('multi-font Google Fonts URL shows error and blocks submission', async ({ page }) => {
    await page.goto(BASE);
    await page.getByText('Fonts').click();
    await expect(page).toHaveURL(`${BASE}/fonts`);

    await page.getByRole('button', { name: /add font/i }).click();
    await page.getByRole('tab', { name: /remote/i }).click();

    const nameInput = page.getByLabel('Name');
    const familyInput = page.getByLabel('Family');
    const fontUrlInput = page.getByLabel('Font URL');
    const submitButton = page.getByRole('button', { name: /add font/i });

    // Paste multi-font URL
    await fontUrlInput.fill(
      'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Roboto:ital,wght@0,100..900;1,100..900&display=swap'
    );

    // Verify error message shown
    await expect(
      page.getByText('Multiple font families detected. Please use a URL with a single font family.')
    ).toBeVisible();

    // Verify submit button is disabled
    await expect(submitButton).toBeDisabled();

    // Verify Name and Family are NOT auto-populated
    await expect(nameInput).toHaveValue('');
    await expect(familyInput).toHaveValue('');

    // Correct to single-font URL
    await fontUrlInput.fill(
      'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap'
    );

    // Verify error clears
    await expect(
      page.getByText('Multiple font families detected. Please use a URL with a single font family.')
    ).not.toBeVisible();

    // Verify fields auto-populated
    await expect(nameInput).toHaveValue('Playfair Display');
    await expect(familyInput).toHaveValue('Playfair Display');

    // Verify submit button is enabled
    await expect(submitButton).toBeEnabled();
  });

  test('non-Google URL does not auto-populate fields', async ({ page }) => {
    await page.goto(BASE);
    await page.getByText('Fonts').click();
    await expect(page).toHaveURL(`${BASE}/fonts`);

    await page.getByRole('button', { name: /add font/i }).click();
    await page.getByRole('tab', { name: /remote/i }).click();

    const nameInput = page.getByLabel('Name');
    const familyInput = page.getByLabel('Family');
    const fontUrlInput = page.getByLabel('Font URL');

    await fontUrlInput.fill('https://example.com/fonts/myfont.woff2');

    // Fields should remain empty
    await expect(nameInput).toHaveValue('');
    await expect(familyInput).toHaveValue('');
  });
});
