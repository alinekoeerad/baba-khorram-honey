'use server';

/**
 * Server Actions for Global Search (Phase 10 Task 1)
 */

import { headers } from 'next/headers';
import { checkRateLimit } from '@/lib/rate-limit';
import { searchGlobal, GlobalSearchResult } from '@/server/queries/search';

export interface SearchActionResult extends Partial<GlobalSearchResult> {
  success: boolean;
  error?: string;
}

export async function searchGlobalAction(rawQuery: string): Promise<SearchActionResult> {
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

    const rateResult = checkRateLimit(`rate_global_search_${clientIp}`, {
      windowMs: 60 * 1000,
      maxAttempts: 60,
    });

    if (!rateResult.success) {
      return {
        success: false,
        error: 'تعداد درخواست‌های جستجو بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.',
      };
    }

    const trimmed = (rawQuery || '').trim();
    if (trimmed.length < 2) {
      return {
        success: true,
        products: [],
        recipes: [],
        totalProducts: 0,
        totalRecipes: 0,
      };
    }

    const results = await searchGlobal({ q: trimmed, take: 8 });

    return {
      success: true,
      ...results,
    };
  } catch (error) {
    console.error('searchGlobalAction error:', error);
    return {
      success: false,
      error: 'خطا در انجام جستجو.',
    };
  }
}
