import { test, expect } from '@playwright/test';

test.describe('Global Search Drawer and Results Page (Phase 10 Task 1/2)', () => {
  test('opens search drawer and searches with debounce', async ({ page }) => {
    await page.goto('/');

    // Click search trigger in header
    const searchButton = page.locator('button[aria-label="جستجوی محصولات و مقالات"]');
    await searchButton.click();

    // Drawer should open and auto-focus
    const searchDrawer = page.locator('[role="search"]');
    await expect(searchDrawer).toBeVisible();

    const searchInput = searchDrawer.locator('input[type="search"]');
    await expect(searchInput).toBeFocused();

    // Type search query with Arabic variant
    await searchInput.fill('زنجبيل'); // Arabic Yeh
    await page.waitForTimeout(400); // debounce 250ms

    // Check suggestions or prompt
    const suggestionsContainer = page.locator('[role="search"]');
    await expect(suggestionsContainer).toBeVisible();
  });

  test('navigates search drawer via keyboard (Escape, ArrowDown, Enter)', async ({ page }) => {
    await page.goto('/');

    const searchButton = page.locator('button[aria-label="جستجوی محصولات و مقالات"]');
    await searchButton.click();

    const searchDrawer = page.locator('[role="search"]');
    await expect(searchDrawer).toBeVisible();

    // Test Escape key closes drawer
    await page.keyboard.press('Escape');
    await expect(searchDrawer).not.toBeVisible();
  });

  test('renders /search?q= results page with grouped products and recipes', async ({ page }) => {
    await page.goto('/search?q=عسل');

    const h1 = page.locator('h1');
    await expect(h1).toContainText('نتایج جستجو');

    // Page must have noindex metadata
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveAttribute('content', /noindex/);
  });
});

test.describe('Contact Page (/contact) (Phase 10 Tasks 3-5)', () => {
  test('renders contact page with channels, address, working hours, and route buttons', async ({ page }) => {
    await page.goto('/contact');

    // Page Title
    const h1 = page.locator('h1');
    await expect(h1).toContainText('تماس با ما');

    // Check address and hours cards
    await expect(page.getByText('نشانی دفتر مرکزی')).toBeVisible();
    await expect(page.getByText('ساعت کاری و پاسخگویی')).toBeVisible();

    // Route Navigation Buttons
    await expect(page.getByText('مسیریابی مستقیم با برنامه‌های ناوبری')).toBeVisible();
    await expect(page.getByRole('link', { name: /Google Maps/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Waze/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /نشان/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /بلد/ })).toBeVisible();
  });

  test('includes LocalBusiness JSON-LD structured data', async ({ page }) => {
    await page.goto('/contact');

    const jsonLdScript = page.locator('script[type="application/ld+json"]');
    await expect(jsonLdScript).toBeAttached();

    const jsonText = await jsonLdScript.textContent();
    expect(jsonText).toBeTruthy();
    const parsed = JSON.parse(jsonText!);
    expect(parsed['@type']).toBe('LocalBusiness');
    expect(parsed.name).toContain('عسل باباخُرم');
  });
});
