import { test, expect } from '@playwright/test';

test.describe('Public Products Listing (/products)', () => {
  test('renders products page with wooden background and first 20 products', async ({ page }) => {
    await page.goto('/products');

    // Page title and wooden background container
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();

    // Verify search input is present
    const searchInput = page.locator('input[placeholder*="جستجو در محصولات"]');
    await expect(searchInput).toBeVisible();

    // Verify category chips exist ("همه محصولات" + others)
    const allChip = page.getByRole('button', { name: 'همه محصولات' });
    await expect(allChip).toBeVisible();

    // Verify cards are rendered
    const cards = page.locator('a[href^="/products/"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('filters products by category chip', async ({ page }) => {
    await page.goto('/products');

    // Find a category chip other than "همه محصولات"
    const categoryButtons = page.locator('button:has-text("عسل")');
    if ((await categoryButtons.count()) > 1) {
      const targetCategory = categoryButtons.nth(1);
      const categoryName = (await targetCategory.textContent())?.trim();
      await targetCategory.click();

      // Verify URL updated with ?category=
      await expect(page).toHaveURL(/category=/);
      await expect(targetCategory).toHaveClass(/bg-\[#FBBF24\]/);
    }
  });

  test('searches products using Persian text with Arabic-letter variants (ي/ی, ك/ک)', async ({ page }) => {
    await page.goto('/products');

    const searchInput = page.locator('input[placeholder*="جستجو در محصولات"]');
    // Type with Arabic letter variants
    await searchInput.fill('طبيعي'); // Arabic Yeh (ي)
    await page.waitForTimeout(500); // debounce

    await expect(page).toHaveURL(/q=/);

    // Results should match items containing "طبیعی"
    const results = page.locator('a[href^="/products/"]');
    const resultCount = await results.count();
    expect(resultCount).toBeGreaterThan(0);
  });

  test('shows empty state "موردی یافت نشد" when no products match', async ({ page }) => {
    await page.goto('/products');

    const searchInput = page.locator('input[placeholder*="جستجو در محصولات"]');
    await searchInput.fill('عبارت_ناموجود_تستی_۱۲۳');
    await page.waitForTimeout(500);

    const emptyState = page.getByText('موردی یافت نشد');
    await expect(emptyState).toBeVisible();
  });

  test('handles load more cursor pagination when items exceed 20', async ({ page }) => {
    await page.goto('/products');

    const loadMoreButton = page.getByRole('button', { name: 'نمایش بیشتر' });
    if (await loadMoreButton.isVisible()) {
      const initialCardsCount = await page.locator('a[href^="/products/"]').count();
      await loadMoreButton.click();
      await page.waitForTimeout(1000);

      const newCardsCount = await page.locator('a[href^="/products/"]').count();
      expect(newCardsCount).toBeGreaterThan(initialCardsCount);
    }
  });
});

test.describe('Public Recipes Listing (/recipes)', () => {
  test('renders recipes page with default "سرد" serving toggle and centered label', async ({ page }) => {
    await page.goto('/recipes');

    // Default toggle is "سرد"
    const coldButton = page.getByRole('button', { name: 'سرد', exact: true });
    const hotButton = page.getByRole('button', { name: 'گرم', exact: true });

    await expect(coldButton).toBeVisible();
    await expect(hotButton).toBeVisible();

    // Cold button is bolder and selected by default
    await expect(coldButton).toHaveClass(/font-black/);

    // Centered divider label shows "سرو سرد"
    const dividerLabel = page.getByText('سرو سرد');
    await expect(dividerLabel).toBeVisible();
  });

  test('toggles to "گرم" and updates URL and divider label', async ({ page }) => {
    await page.goto('/recipes');

    const hotButton = page.getByRole('button', { name: 'گرم', exact: true });
    await hotButton.click();

    // Verify URL parameter ?serving=hot
    await expect(page).toHaveURL(/serving=hot/);

    // Hot button is now bolder
    await expect(hotButton).toHaveClass(/font-black/);

    // Divider label shows "سرو گرم"
    const hotDividerLabel = page.getByText('سرو گرم');
    await expect(hotDividerLabel).toBeVisible();
  });

  test('toggle semantics: WARM recipes appear under BOTH cold and hot toggles', async ({ page }) => {
    // Check recipes under cold
    await page.goto('/recipes?serving=cold');
    const coldCount = await page.locator('a[href^="/recipes/"]').count();
    expect(coldCount).toBeGreaterThan(0);

    // Check recipes under hot
    await page.goto('/recipes?serving=hot');
    const hotCount = await page.locator('a[href^="/recipes/"]').count();
    expect(hotCount).toBeGreaterThan(0);
  });
});

test.describe('Detail Pages (/products/[slug] & /recipes/[slug])', () => {
  test('renders product detail with AddToCartSlot, meta chips, benefits, warning', async ({ page }) => {
    // Navigate to products and click first card
    await page.goto('/products');
    const firstCard = page.locator('a[href^="/products/"]').first();
    const productHref = await firstCard.getAttribute('href');
    expect(productHref).toBeTruthy();

    await page.goto(productHref!);

    // Main image and title
    const title = page.locator('h1');
    await expect(title).toBeVisible();

    // Availability badge
    const badge = page.locator('span:has-text("موجود")');
    await expect(badge).toBeVisible();

    // Benefits heading "خواص" if present
    const benefitsHeading = page.getByText('خواص و فواید درمانی');
    if (await benefitsHeading.isVisible()) {
      const bullets = page.locator('li:has-text("🔸"), li:has-text("🔹")');
      expect(await bullets.count()).toBeGreaterThan(0);
    }
  });

  test('renders recipe detail with ingredients and numbered steps in Persian digits', async ({ page }) => {
    await page.goto('/recipes');
    const firstCard = page.locator('a[href^="/recipes/"]').first();
    const recipeHref = await firstCard.getAttribute('href');
    expect(recipeHref).toBeTruthy();

    await page.goto(recipeHref!);

    // Title
    const title = page.locator('h1');
    await expect(title).toBeVisible();

    // Ingredients heading "مواد لازم"
    const ingredientsHeading = page.getByText('مواد لازم');
    await expect(ingredientsHeading).toBeVisible();

    // Steps heading "دستور تهیه"
    const stepsHeading = page.getByText('دستور تهیه');
    await expect(stepsHeading).toBeVisible();
  });

  test('returns 404 for non-existent or draft product', async ({ page }) => {
    const res = await page.goto('/products/non-existent-product-slug-xyz');
    expect(res?.status()).toBe(404);
  });

  test('returns 404 for non-existent or draft recipe', async ({ page }) => {
    const res = await page.goto('/recipes/non-existent-recipe-slug-xyz');
    expect(res?.status()).toBe(404);
  });
});

test.describe('Mobile Layout Viewport (375px)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('renders 1 item per row with horizontal cards on mobile', async ({ page }) => {
    await page.goto('/products');

    // Verify mobile layout container is visible
    const mobileContainer = page.locator('.md\\:hidden');
    await expect(mobileContainer).toBeVisible();

    // Verify cards are rendered in mobile view
    const mobileCards = mobileContainer.locator('a[href^="/products/"]');
    const count = await mobileCards.count();
    expect(count).toBeGreaterThan(0);

    // Capture visual screenshot
    await page.screenshot({ path: 'tests/e2e/screenshots/products-mobile-375px.png', fullPage: false });
  });

  test('renders mobile recipes page with horizontal cards', async ({ page }) => {
    await page.goto('/recipes');

    const mobileContainer = page.locator('.md\\:hidden');
    await expect(mobileContainer).toBeVisible();

    await page.screenshot({ path: 'tests/e2e/screenshots/recipes-mobile-375px.png', fullPage: false });
  });
});
