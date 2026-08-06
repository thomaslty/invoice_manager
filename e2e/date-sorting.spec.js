import { test, expect } from '@playwright/test';
import { BASE, createInvoice, deleteInvoices, tableRows } from './helpers.js';

/**
 * These dates are chosen to fail under the old behaviour, where the displayed
 * string was stored in the sort column and SQLite compared it as text: that
 * ordered by day-of-month first, then by month name alphabetically.
 */
const SEED = [
  { refNo: 'SORT-2020', client: 'Sort A', date: '5 March, 2020', shown: 'Mar 5, 2020' },
  { refNo: 'SORT-2022', client: 'Sort B', date: '30 September, 2022', shown: 'Sep 30, 2022' },
  { refNo: 'SORT-2025', client: 'Sort C', date: '1 December, 2025', shown: 'Dec 1, 2025' },
  { refNo: 'SORT-2026', client: 'Sort D', date: '2 January, 2026', shown: 'Jan 2, 2026' },
];

test.describe('Date sorting and filtering', () => {
  const created = [];

  test.beforeAll(async ({ request }) => {
    for (const row of SEED) {
      created.push(await createInvoice(request, { ...row, total: 100 }));
    }
  });

  test.afterAll(async ({ request }) => {
    await deleteInvoices(request, created);
  });

  /** Only the rows this spec seeded, in the order the table renders them. */
  async function seededOrder(page) {
    const rows = await tableRows(page);
    return rows.filter((r) => r.refNo.startsWith('SORT-'));
  }

  test('sorts newest first, then oldest first', async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole('row').first().waitFor();

    // The table opens sorted by date descending.
    let order = await seededOrder(page);
    expect(order.map((r) => r.refNo)).toEqual(['SORT-2026', 'SORT-2025', 'SORT-2022', 'SORT-2020']);
    expect(order.map((r) => r.date)).toEqual(['Jan 2, 2026', 'Dec 1, 2025', 'Sep 30, 2022', 'Mar 5, 2020']);

    await page.getByRole('button', { name: 'Date' }).click();
    await expect
      .poll(async () => (await seededOrder(page)).map((r) => r.refNo))
      .toEqual(['SORT-2020', 'SORT-2022', 'SORT-2025', 'SORT-2026']);
  });

  test('displays each date on the right day', async ({ page }) => {
    await page.goto(BASE);
    const order = await seededOrder(page);
    for (const row of order) {
      const seed = SEED.find((s) => s.refNo === row.refNo);
      // An ISO date read as UTC would render as the previous day.
      expect(row.date).toBe(seed.shown);
    }
  });

  test('the From/To filter matches real calendar dates', async ({ page }) => {
    await page.goto(BASE);
    const from = page.locator('input[type="date"]').nth(0);
    const to = page.locator('input[type="date"]').nth(1);

    await from.fill('2025-01-01');
    await expect
      .poll(async () => (await seededOrder(page)).map((r) => r.refNo))
      .toEqual(['SORT-2026', 'SORT-2025']);

    await to.fill('2025-12-31');
    await expect
      .poll(async () => (await seededOrder(page)).map((r) => r.refNo))
      .toEqual(['SORT-2025']);

    await page.getByRole('button', { name: 'Clear' }).click();
    await expect.poll(async () => (await seededOrder(page)).length).toBe(4);
  });

  test('the API returns ISO dates in chronological order', async ({ request }) => {
    const res = await request.get(`${BASE}/api/invoices?sort_by=date&sort_order=asc`);
    const dates = (await res.json())
      .filter((i) => i.refNo?.startsWith('SORT-'))
      .map((i) => i.date);
    expect(dates).toEqual(['2020-03-05', '2022-09-30', '2025-12-01', '2026-01-02']);
  });
});
