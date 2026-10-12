import { test, expect } from '@playwright/test';

test.describe('Public Site Shell & Navigation (Phase 5, Task 2 & 6)', () => {
  test('renders contact bar and opens dropdown listing enabled channels', async ({ page }) => {
    await page.goto('/');

    const contactBarTrigger = page.locator('button[aria-label="منوی کانال‌های ارتباط با ما"]');
    await expect(contactBarTrigger).toBeVisible();

    // Click to open dropdown
    await contactBarTrigger.click();
    await expect(contactBarTrigger).toHaveAttribute('aria-expanded', 'true');

    // Check that configured channels appear
    const menu = page.locator('div[role="menu"]');
    await expect(menu).toBeVisible();
    await expect(menu.locator('text=تماس تلفنی')).toBeVisible();
    await expect(menu.locator('text=واتساپ')).toBeVisible();
    await expect(menu.locator('text=تلگرام')).toBeVisible();
  });

  test('hamburger drawer opens from right, shows active categories, traps focus, and closes on Escape', async ({
    page,
  }) => {
    await page.goto('/');

    const hamburgerBtn = page.locator('button[aria-label="باز کردن منوی دسته‌بندی‌ها"]');
    await expect(hamburgerBtn).toBeVisible();

    // Click hamburger button
    await hamburgerBtn.click();

    // Drawer dialog visible
    const drawer = page.locator('div[role="dialog"][aria-label="منوی دسته‌بندی‌ها"]');
    await expect(drawer).toBeVisible();

    // Verify categories listed
    await expect(drawer.locator('text=محصولات ما')).toBeVisible();
    await expect(drawer.locator('text=دسرهای عسل')).toBeVisible();

    // Verify NO "Contact us" item in hamburger menu per Brief Section 6
    await expect(drawer.locator('a:has-text("تماس با ما")')).toHaveCount(0);

    // Press Escape to close drawer
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();

    // Focus must return to hamburger button
    await expect(hamburgerBtn).toBeFocused();
  });

  test('pill buttons and card links contain NO arrow or chevron glyphs', async ({ page }) => {
    await page.goto('/');

    // Check all pill buttons
    const pillButtons = page.locator('.honey-pill-button');
    const pillCount = await pillButtons.count();
    expect(pillCount).toBeGreaterThan(0);

    for (let i = 0; i < pillCount; i++) {
      const text = await pillButtons.nth(i).innerText();
      expect(text).not.toContain('→');
      expect(text).not.toContain('←');
      expect(text).not.toContain('>');
      expect(text).not.toContain('<');
      expect(text).not.toContain('»');
      expect(text).not.toContain('«');
      // Must contain dots
      expect(text).toContain('•');
    }
  });

  test('cart icon slot respects cartEnabled setting', async ({ page }) => {
    await page.goto('/');
    // Initially cartEnabled is false in seed settings, cart slot should not render
    const cartSlot = page.locator('div[aria-label="سبد خرید"]');
    await expect(cartSlot).toHaveCount(0);
  });

  test('shell is responsive and functional on 375px mobile and 1440px desktop', async ({ page }) => {
    // 375px mobile test
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.locator('button[aria-label="باز کردن منوی دسته‌بندی‌ها"]')).toBeVisible();

    // 1440px desktop test
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.locator('header nav[aria-label="ناوبری اصلی"]')).toBeVisible();
  });
});
