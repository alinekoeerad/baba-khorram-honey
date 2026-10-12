'use server';

/**
 * Server Actions for Cart Operations (Phase 9 Task 5)
 */

import { headers } from 'next/headers';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  CartLookupInput,
  getFreshCartItems,
  FreshCartLineItem,
} from '@/server/queries/cart';

export interface FreshCartActionResult {
  success: boolean;
  items?: FreshCartLineItem[];
  hasUnavailableItems?: boolean;
  error?: string;
}

export async function fetchFreshCartAction(
  lines: CartLookupInput
): Promise<FreshCartActionResult> {
  try {
    let clientIp = '127.0.0.1';
    try {
      const headersList = await headers();
      clientIp =
        headersList.get('x-forwarded-for')?.split(',')[0].trim() ||
        headersList.get('x-real-ip') ||
        '127.0.0.1';
    } catch {
      // Request scope not available (e.g. test environment)
    }

    const rateResult = checkRateLimit(`rate_cart_lookup_${clientIp}`, {
      windowMs: 60 * 1000,
      maxAttempts: 60,
    });

    if (!rateResult.success) {
      return {
        success: false,
        error: 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی بعد دوباره امتحان کنید.',
      };
    }

    const { items, hasUnavailableItems } = await getFreshCartItems(lines);

    return {
      success: true,
      items,
      hasUnavailableItems,
    };
  } catch (err) {
    console.error('fetchFreshCartAction error:', err);
    return {
      success: false,
      error: 'خطا در بارگذاری اطلاعات تازه سبد خرید.',
    };
  }
}
