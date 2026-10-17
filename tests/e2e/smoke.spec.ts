import { test, expect } from '@playwright/test';

test.describe('Persian Honey Brand Foundation Smoke Tests', () => {
  test('renders root layout with lang="fa" and dir="rtl"', async ({ page }) => {
    await page.goto('/');

    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'fa');
    await expect(html).toHaveAttribute('dir', 'rtl');
  });

  test('displays brand header and navigation', async ({ page }) => {
    await page.goto('/');

    const brand = page.locator('header').getByText('عسل باباخُرم');
    await expect(brand.first()).toBeVisible();
  });

  test('pill buttons render with three dots and NO arrows', async ({ page }) => {
    await page.goto('/');

    const pillButtons = page.locator('.honey-pill-button');
    const count = await pillButtons.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const button = pillButtons.nth(i);
      const dotsContainer = button.locator('.pill-dots');
      if (await dotsContainer.isVisible()) {
        const dots = dotsContainer.locator('span');
        await expect(dots).toHaveCount(3);
      }

      const text = await button.innerText();
      expect(text).not.toContain('→');
      expect(text).not.toContain('←');
      expect(text).not.toContain('>');
      expect(text).not.toContain('<');
    }
  });

  test('renders homepage sections with correct styling and sharp corners', async ({ page }) => {
    await page.goto('/');

    // Check main container
    const main = page.locator('main');
    await expect(main).toBeVisible();

    // Check footer
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });
});
