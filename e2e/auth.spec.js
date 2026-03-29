import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';

async function openNavUser(page) {
  const sidebar = page.locator('[data-slot="sidebar"]');
  await sidebar.getByRole('button', { name: /Admin/i }).click();
}

test.describe('Auth bypass and NavUser UI', () => {
  test('app loads without login redirect (BYPASS_LOGIN works)', async ({ page }) => {
    await page.goto(BASE);
    await expect(page).toHaveURL(BASE + '/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('GET /api/auth/me returns admin user', async ({ request }) => {
    const res = await request.get(`${BASE}/api/auth/me`);
    expect(res.status()).toBe(200);
    const user = await res.json();
    expect(user.email).toBe('admin@localhost');
    expect(user.name).toBe('Admin');
  });

  test('NavUser visible in sidebar footer showing user name and email', async ({ page }) => {
    await page.goto(BASE);
    const footer = page.locator('[data-slot="sidebar-footer"]');
    await expect(footer.getByText('Admin', { exact: true })).toBeVisible();
    await expect(footer.getByText('admin@localhost')).toBeVisible();
  });

  test('NavUser dropdown opens with theme options and Log out', async ({ page }) => {
    await page.goto(BASE);
    await openNavUser(page);

    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await expect(menu.getByText('Light')).toBeVisible();
    await expect(menu.getByText('Dark')).toBeVisible();
    await expect(menu.getByText('System')).toBeVisible();
    await expect(menu.getByText('Log out')).toBeVisible();
  });

  test('clicking Dark applies dark class to document root', async ({ page }) => {
    await page.goto(BASE);
    await openNavUser(page);
    await page.getByRole('menu').getByText('Dark').click();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('clicking Light removes dark class from document root', async ({ page }) => {
    await page.goto(BASE);
    // First set dark
    await openNavUser(page);
    await page.getByRole('menu').getByText('Dark').click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Then set light
    await openNavUser(page);
    await page.getByRole('menu').getByText('Light').click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });

  test('clicking Log out in bypass mode redirects to /', async ({ page }) => {
    await page.goto(BASE);
    await openNavUser(page);
    await page.getByRole('menu').getByText('Log out').click();
    await page.waitForURL('**/');
    await expect(page).toHaveURL(BASE + '/');
  });

  test('standalone ModeToggle button is no longer in sidebar footer', async ({ page }) => {
    await page.goto(BASE);
    const footer = page.locator('[data-slot="sidebar-footer"]');
    await expect(footer.getByRole('button', { name: 'Toggle theme' })).toHaveCount(0);
  });
});

test.describe('Login page', () => {
  test('GET /api/auth/config returns oidcName', async ({ request }) => {
    const res = await request.get(`${BASE}/api/auth/config`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.oidcName).toBeDefined();
  });

  test('authenticated user visiting /login redirects to /', async ({ page }) => {
    // In BYPASS_LOGIN mode, user is always authenticated
    // This also verifies the /login route exists and LoginPage component loads
    await page.goto(`${BASE}/login`);
    await page.waitForURL('**/');
    await expect(page).toHaveURL(BASE + '/');
  });
});
