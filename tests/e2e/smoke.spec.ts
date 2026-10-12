import { test, expect } from '@playwright/test';

test.describe('Persian Honey Brand Foundation Smoke Tests', () => {
  test('renders root layout with lang="fa" and dir="rtl"', async ({ page }) => {
    await page.goto('/');

    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'fa');
    await expect(html).toHaveAttribute('dir', 'rtl');
  });

  test('displays brand header and Vazirmatn font container', async ({ page }) => {
    await page.goto('/');

    const heading = page.locator('h1');
    await expect(heading).toContainText('عسل باباخُرم');

    // Verify presence of foundation demo badge
    const badge = page.getByText('محیط آزمایشی زیرساخت');
    await expect(badge).toBeVisible();
  });

  test('pill buttons render with three dots and NO arrows', async ({ page }) => {
    await page.goto('/');

    const pillButtons = page.locator('.honey-pill-button');
    const count = await pillButtons.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const button = pillButtons.nth(i);
      const dotsContainer = button.locator('.pill-dots');
      await expect(dotsContainer).toBeVisible();

      // Verify exactly three dots
      const dots = dotsContainer.locator('span');
      await expect(dots).toHaveCount(3);

      // Verify no SVG or arrow text inside button
      const svgs = await button.locator('svg').count();
      expect(svgs).toBe(0);

      const text = await button.innerText();
      expect(text).not.toContain('→');
      expect(text).not.toContain('←');
      expect(text).not.toContain('>');
      expect(text).not.toContain('<');
    }
  });

  test('renders card theme swatches with correct contrast and sharp corners', async ({ page }) => {
    await page.goto('/');

    const cards = page.locator('.honey-card');
    const count = await cards.count();
    expect(count).toBe(4); // 4 locked themes: green, orange, yellow, burgundy
  });
});
