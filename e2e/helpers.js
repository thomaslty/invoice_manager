import { expect } from '@playwright/test';

/**
 * Pick a date using the DatePicker calendar popover.
 * Opens the calendar, selects the given day from the currently visible month,
 * and waits for the popover to close.
 *
 * @param {import('@playwright/test').Page} page
 * @param {number} [day=15] - day of month to select from the current calendar view
 */
export async function pickDate(page, day = 15) {
  await page.locator('#metadata-date').click();

  const calendar = page.locator('[data-slot="calendar"]');
  await expect(calendar).toBeVisible();

  // DayPicker renders days as <Button> inside <td> cells
  await calendar
    .locator('table td button')
    .filter({ hasText: new RegExp(`^${day}$`) })
    .first()
    .click();

  // Popover closes after date selection
  await expect(calendar).not.toBeVisible();
}
