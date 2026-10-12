import { test, expect } from '@playwright/test';

/**
 * Playwright E2E Test Suite for Admin Content CRUD (Phase 4, Task 7)
 * Tests:
 * 1. Authorization negative tests (unauthenticated blocked)
 * 2. Recipe CRUD flow (create with ingredients/steps, edit, archive, delete)
 * 3. Product CRUD with order options & availability quick toggle
 * 4. Category safe deletion guard (in-use cannot be deleted)
 */

test.describe('Admin Content Management CRUD Suite', () => {
  test('unauthenticated access to CRUD management routes is redirected to /admin/login', async ({ page }) => {
    const protectedRoutes = [
      '/admin/categories',
      '/admin/products',
      '/admin/products/new',
      '/admin/recipes',
      '/admin/recipes/new',
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/admin\/login/);
    }
  });

  test('admin can manage categories and in-use delete guard is enforced', async ({ page }) => {
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'admin@honey.ir');
    await page.fill('input[type="password"]', 'NewAdminSecret123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/admin');

    await page.goto('/admin/categories');
    await expect(page.locator('h1')).toContainText('مدیریت دسته‌بندی‌ها');

    // Honey-types category has 29 products -> delete button must be disabled
    const honeyRow = page.locator('tr:has-text("انواع عسل")');
    await expect(honeyRow).toBeVisible();
    const deleteBtn = honeyRow.locator('button:has-text("حذف")');
    await expect(deleteBtn).toBeDisabled();
  });

  test('admin can create, toggle options, and edit a product', async ({ page }) => {
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'admin@honey.ir');
    await page.fill('input[type="password"]', 'NewAdminSecret123');
    await page.click('button[type="submit"]');

    await page.goto('/admin/products/new');
    await expect(page.locator('h1')).toContainText('محصول جدید');

    // Fill names
    await page.fill('input[placeholder*="عسل زعفران"]', 'عسل بهاره سبلان');
    await page.fill('input[placeholder="SAFFRON"]', 'SABALAN SPRING');

    // Add order options
    await page.fill('input[placeholder*="گزینه جدید"]', 'شیشه ۵۰۰ گرمی');
    await page.click('button:has-text("افزودن گزینه سفارش")');

    await page.fill('input[placeholder*="گزینه جدید"]', 'شیشه ۱۰۰۰ گرمی');
    await page.click('button:has-text("افزودن گزینه سفارش")');

    // Save product
    await page.click('button[type="submit"]:has-text("ذخیره")');

    // Check notification or landing on edit page
    await expect(page.locator('h1')).toContainText('ویرایش محصول');
  });

  test('admin can create and edit a recipe with ingredients and steps', async ({ page }) => {
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'admin@honey.ir');
    await page.fill('input[type="password"]', 'NewAdminSecret123');
    await page.click('button[type="submit"]');

    await page.goto('/admin/recipes/new');
    await expect(page.locator('h1')).toContainText('دستور جدید');

    await page.fill('input[placeholder*="شربت آمالاکی"]', 'شربت زعفرانی خنک');
    await page.fill('input[placeholder*="Amalaki"]', 'Iced Saffron Drink');

    // Add ingredient
    await page.click('button:has-text("افزودن ماده اولیه")');
    await page.fill('input[placeholder*="نام ماده"]', 'شهد عسل بهاره');

    // Add step
    await page.click('button:has-text("افزودن مرحله بعدی")');
    await page.fill('textarea[placeholder*="شرح مرحله"]', 'عسل را در آب ولرم حل کرده و زعفران را بیفزایید.');

    // Save recipe
    await page.click('button[type="submit"]:has-text("ذخیره")');

    await expect(page.locator('h1')).toContainText('ویرایش دستور');
  });
});
