import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';

// Multi-line, resizable line-item description + line-break rendering in preview.
// Uses Chinese content so the same flow also exercises CJK text end to end.
const MULTILINE = '顧問服務\nPhase 1: 設計\nPhase 2: 開發';

test.describe('Resizable multi-line item description', () => {
  test('description is a vertically-resizable textarea and renders line breaks in preview', async ({
    page,
  }) => {
    await page.goto(`${BASE}/invoices/new`);

    const desc = page.getByPlaceholder('Item description');

    // It is a <textarea>, not a single-line <input>.
    await expect(desc).toHaveJSProperty('tagName', 'TEXTAREA');

    // It is user-resizable (vertical only, so it never distorts the table columns).
    const resize = await desc.evaluate((el) => getComputedStyle(el).resize);
    expect(resize).toBe('vertical');

    // Enter multi-line text; the value keeps the newlines.
    await desc.fill(MULTILINE);
    await expect(desc).toHaveValue(MULTILINE);

    // Give it a total so the preview renders the row.
    await page.locator('tbody tr:first-child td:nth-child(4) input').fill('100');

    // Screenshot: editor with the multi-line textarea.
    await page.waitForTimeout(600);
    await page.screenshot({ path: '.playwright-mcp/editor-multiline-description.png', fullPage: true });

    // Preview iframe: the description cell preserves newlines and renders on multiple lines.
    const iframe = page.frameLocator('iframe');
    const cell = iframe.locator('.item-row .col-desc');
    await expect(cell).toContainText('顧問服務');
    await expect(cell).toContainText('Phase 2: 開發');

    // white-space: pre-line is what turns the saved "\n" into a visible line break.
    const whiteSpace = await cell.evaluate((el) => getComputedStyle(el).whiteSpace);
    expect(whiteSpace).toBe('pre-line');

    // The rendered cell is taller than a single line (multi-line actually renders).
    const height = await cell.evaluate((el) => el.getBoundingClientRect().height);
    expect(height).toBeGreaterThan(30);

    // Screenshot: preview showing the multi-line, CJK description.
    await page.screenshot({ path: '.playwright-mcp/preview-multiline-description.png', fullPage: true });
  });
});
