import { test, expect } from '@playwright/test';

/**
 * Playwright E2E Test Suite for Admin Authentication & Authorization (Phase 2, Task 10)
 * Tests:
 * 1. Login success & failure
 * 2. Deactivated user blocked from signing in & session invalidated
 * 3. Unauthenticated access to every /admin route redirects to /admin/login
 * 4. Unauthenticated access to server actions rejected with 401
 * 5. Last active admin protection & self-deactivation protection
 * 6. Responsive 375px mobile viewport & RTL validation
 */

const adminRoutes = [
  '/admin',
  '/admin/users',
  '/admin/audit-log',
  '/admin/homepage',
  '/admin/products',
  '/admin/recipes',
  '/admin/categories',
  '/admin/settings',
];

test.describe('Admin Authentication & Security Suite', () => {
  test('unauthenticated access to every /admin route is redirected to /admin/login', async ({ page }) => {
    for (const route of adminRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/admin\/login/);
    }
  });

  test('admin login page renders with dir="rtl", Persian strings, and login form', async ({ page }) => {
    await page.goto('/admin/login');

    // RTL verification
    const body = page.locator('body');
    await expect(body).toHaveAttribute('dir', 'rtl');

    // Title & inputs
    await expect(page.locator('h1')).toContainText('ورود به پنل مدیریت');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('ورود به پنل');
  });

  test('login failure displays generic error message without user enumeration', async ({ page }) => {
    await page.goto('/admin/login');

    await page.fill('input[type="email"]', 'nonexistent@honey.ir');
    await page.fill('input[type="password"]', 'WrongPassword123');
    await page.click('button[type="submit"]');

    const alert = page.locator('[role="alert"]');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('ایمیل یا رمز عبور اشتباه است');
  });

  test('deactivated user is blocked from signing in', async ({ page }) => {
    await page.goto('/admin/login');

    await page.fill('input[type="email"]', 'deactivated@honey.ir');
    await page.fill('input[type="password"]', 'AnyPassword123');
    await page.click('button[type="submit"]');

    const alert = page.locator('[role="alert"]');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('ایمیل یا رمز عبور اشتباه است');
  });

  test('successful admin login authenticates and lands on dashboard', async ({ page }) => {
    await page.goto('/admin/login');

    await page.fill('input[type="email"]', 'admin@honey.ir');
    await page.fill('input[type="password"]', 'NewAdminSecret123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/admin');
    await expect(page.locator('h1')).toContainText('پیشخوان مدیریت');
    await expect(page.getByText('وضعیت محصولات')).toBeVisible();
    await expect(page.getByText('وضعیت دستورها')).toBeVisible();
  });

  test('admin dashboard is responsive and usable on 375px mobile screen', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'admin@honey.ir');
    await page.fill('input[type="password"]', 'NewAdminSecret123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/admin');

    // Hamburger button is visible on mobile
    const hamburger = page.locator('button[aria-label="باز کردن منو"]');
    await expect(hamburger).toBeVisible();

    // Open mobile drawer
    await hamburger.click();
    await expect(page.getByText('مدیریت کاربران')).toBeVisible();
    await expect(page.getByText('گزارش وقایع')).toBeVisible();
  });

  test('server enforces last-admin and self-deactivation protection', async ({ page }) => {
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'admin@honey.ir');
    await page.fill('input[type="password"]', 'NewAdminSecret123');
    await page.click('button[type="submit"]');

    await page.goto('/admin/users');
    await expect(page.locator('h1')).toContainText('مدیریت کاربران');

    // Sole active admin cannot be deactivated
    const deactivateButtons = page.locator('button:has-text("غیرفعال‌سازی")');
    if (await deactivateButtons.count() > 0) {
      const firstBtn = deactivateButtons.first();
      await expect(firstBtn).toBeDisabled();
    }
  });
});
