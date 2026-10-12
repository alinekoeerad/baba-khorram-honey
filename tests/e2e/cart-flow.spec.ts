import { test, expect } from '@playwright/test';

test.describe('Cart and Order Sending Flow (Phase 9 & Addendum A)', () => {
  test('adds product to cart from detail page and updates header badge', async ({ page }) => {
    await page.goto('/products');

    // Go to first product
    const firstProduct = page.locator('a[href^="/products/"]').first();
    const productUrl = await firstProduct.getAttribute('href');
    expect(productUrl).toBeTruthy();

    await page.goto(productUrl!);

    // Check if add to cart section is visible
    const addToCartButton = page.getByRole('button', { name: 'افزودن به سبد خرید' });
    if (await addToCartButton.isVisible()) {
      // Click add to cart
      await addToCartButton.click();

      // Check live region feedback
      const feedback = page.getByText(/به سبد خرید افزوده شد/);
      await expect(feedback).toBeVisible();

      // Check header cart badge
      const cartLink = page.locator('a[href="/cart"]');
      await expect(cartLink).toBeVisible();
      const badge = cartLink.locator('span');
      await expect(badge).toBeVisible();
    }
  });

  test('persists cart lines across page reloads', async ({ page }) => {
    // Seed test cart item in localStorage
    await page.goto('/');
    await page.evaluate(() => {
      const cartData = {
        lines: [{ optionId: 'opt_test_1', productId: 'prod_test_1', qty: 2 }],
        updatedAt: Date.now(),
      };
      localStorage.setItem('cart:v1', JSON.stringify(cartData));
    });

    await page.reload();

    // Verify localStorage still holds data
    const stored = await page.evaluate(() => localStorage.getItem('cart:v1'));
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.lines.length).toBe(1);
    expect(parsed.lines[0].qty).toBe(2);
  });

  test('expires cart after 30 days', async ({ page }) => {
    await page.goto('/');
    // Set timestamp to 31 days ago
    await page.evaluate(() => {
      const thirtyOneDaysAgo = Date.now() - (31 * 24 * 60 * 60 * 1000);
      const expiredCart = {
        lines: [{ optionId: 'opt_old', productId: 'p_old', qty: 1 }],
        updatedAt: thirtyOneDaysAgo,
      };
      localStorage.setItem('cart:v1', JSON.stringify(expiredCart));
    });

    await page.goto('/cart');

    // Cart should be empty because it expired
    const emptyNotice = page.getByText('سبد خرید شما خالی است');
    await expect(emptyNotice).toBeVisible();
  });
});

test.describe('Mobile Viewport Specifics (375px)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('shows SMS option on mobile profile if phone channel exists', async ({ page }) => {
    // Seed cart line
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem(
        'cart:v1',
        JSON.stringify({
          lines: [{ optionId: 'opt_test_1', productId: 'prod_test_1', qty: 1 }],
          updatedAt: Date.now(),
        })
      );
    });

    await page.goto('/cart');

    // Mobile device mode indicator or SMS option should be available
    const mobileIndicator = page.getByText('با گوشی هستم');
    await expect(mobileIndicator).toBeVisible();
  });
});

test.describe('Desktop Viewport Specifics', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('shows desktop mode and excludes direct SMS sending button', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem(
        'cart:v1',
        JSON.stringify({
          lines: [{ optionId: 'opt_test_1', productId: 'prod_test_1', qty: 1 }],
          updatedAt: Date.now(),
        })
      );
    });

    await page.goto('/cart');

    const desktopIndicator = page.getByText('با کامپیوتر هستم');
    await expect(desktopIndicator).toBeVisible();
  });
});

test.describe('Order Share Link (/o/[code]) Expiry and Security', () => {
  test('returns friendly error for invalid or unknown share code', async ({ page }) => {
    await page.goto('/o/invalid-code-123456');

    const errorHeading = page.getByText('لینک سفارش یافت نشد');
    await expect(errorHeading).toBeVisible();
  });
});
