import { describe, it, expect } from 'vitest';
import {
  clampQuantity,
  isCartExpired,
  getCartTotalQuantity,
  mergeCartLine,
  updateLineQuantity,
  removeCartLine,
  CART_EXPIRY_MS,
  CartLine,
} from '@/lib/cart-store';

describe('Cart Store Pure Functions (Phase 9 Task 2 & Addendum A3)', () => {
  describe('clampQuantity', () => {
    it('clamps quantities less than 1 to 1', () => {
      expect(clampQuantity(0)).toBe(1);
      expect(clampQuantity(-5)).toBe(1);
      expect(clampQuantity(NaN)).toBe(1);
    });

    it('clamps quantities greater than 50 to 50', () => {
      expect(clampQuantity(51)).toBe(50);
      expect(clampQuantity(100)).toBe(50);
      expect(clampQuantity(999)).toBe(50);
    });

    it('floors fractional quantities', () => {
      expect(clampQuantity(3.7)).toBe(3);
      expect(clampQuantity(1.1)).toBe(1);
    });

    it('preserves valid quantities between 1 and 50', () => {
      expect(clampQuantity(1)).toBe(1);
      expect(clampQuantity(25)).toBe(25);
      expect(clampQuantity(50)).toBe(50);
    });
  });

  describe('isCartExpired (30-day rule)', () => {
    it('returns false for recently updated carts', () => {
      const now = 1000000000000;
      const recent = now - 1000 * 60 * 60; // 1 hour ago
      expect(isCartExpired(recent, now)).toBe(false);
    });

    it('returns false for carts updated 29 days ago', () => {
      const now = 1000000000000;
      const twentyNineDays = now - 29 * 24 * 60 * 60 * 1000;
      expect(isCartExpired(twentyNineDays, now)).toBe(false);
    });

    it('returns true for carts older than 30 days', () => {
      const now = 1000000000000;
      const thirtyOneDays = now - (CART_EXPIRY_MS + 1000);
      expect(isCartExpired(thirtyOneDays, now)).toBe(true);
    });

    it('returns true for missing or invalid timestamps', () => {
      expect(isCartExpired(0)).toBe(true);
      expect(isCartExpired(NaN)).toBe(true);
    });
  });

  describe('mergeCartLine', () => {
    it('adds a new line if optionId is not in cart', () => {
      const lines: CartLine[] = [{ optionId: 'opt_1', productId: 'p1', qty: 2 }];
      const newLine: CartLine = { optionId: 'opt_2', productId: 'p2', qty: 3 };

      const res = mergeCartLine(lines, newLine);
      expect(res.lines.length).toBe(2);
      expect(res.lines[1]).toEqual({ optionId: 'opt_2', productId: 'p2', qty: 3 });
    });

    it('merges quantities when same optionId is added', () => {
      const lines: CartLine[] = [{ optionId: 'opt_1', productId: 'p1', qty: 2 }];
      const newLine: CartLine = { optionId: 'opt_1', productId: 'p1', qty: 4 };

      const res = mergeCartLine(lines, newLine);
      expect(res.lines.length).toBe(1);
      expect(res.lines[0].qty).toBe(6);
    });

    it('caps combined quantity at 50', () => {
      const lines: CartLine[] = [{ optionId: 'opt_1', productId: 'p1', qty: 40 }];
      const newLine: CartLine = { optionId: 'opt_1', productId: 'p1', qty: 20 };

      const res = mergeCartLine(lines, newLine);
      expect(res.lines[0].qty).toBe(50);
    });

    it('enforces maximum 30 distinct lines limit', () => {
      const maxLines: CartLine[] = Array.from({ length: 30 }, (_, i) => ({
        optionId: `opt_${i}`,
        productId: `prod_${i}`,
        qty: 1,
      }));

      const extraLine: CartLine = { optionId: 'opt_new', productId: 'prod_new', qty: 1 };
      const res = mergeCartLine(maxLines, extraLine, 30);

      expect(res.lines.length).toBe(30);
      expect(res.error).toBeDefined();
    });
  });

  describe('updateLineQuantity & removeCartLine', () => {
    it('updates quantity of target optionId', () => {
      const lines: CartLine[] = [
        { optionId: 'opt_1', productId: 'p1', qty: 2 },
        { optionId: 'opt_2', productId: 'p2', qty: 3 },
      ];

      const updated = updateLineQuantity(lines, 'opt_1', 10);
      expect(updated[0].qty).toBe(10);
      expect(updated[1].qty).toBe(3);
    });

    it('removes target optionId', () => {
      const lines: CartLine[] = [
        { optionId: 'opt_1', productId: 'p1', qty: 2 },
        { optionId: 'opt_2', productId: 'p2', qty: 3 },
      ];

      const afterRemove = removeCartLine(lines, 'opt_1');
      expect(afterRemove.length).toBe(1);
      expect(afterRemove[0].optionId).toBe('opt_2');
    });
  });

  describe('getCartTotalQuantity', () => {
    it('correctly calculates sum of quantities', () => {
      const lines: CartLine[] = [
        { optionId: 'opt_1', productId: 'p1', qty: 2 },
        { optionId: 'opt_2', productId: 'p2', qty: 5 },
        { optionId: 'opt_3', productId: 'p3', qty: 1 },
      ];
      expect(getCartTotalQuantity(lines)).toBe(8);
    });
  });
});
