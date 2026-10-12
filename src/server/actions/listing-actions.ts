'use server';

import { z } from 'zod';
import { headers } from 'next/headers';
import { checkRateLimit } from '@/lib/rate-limit';
import { getPublicProducts, ProductCardViewModel, ProductCursor } from '@/server/queries/products';
import { getPublicRecipes, RecipeCardViewModel, RecipeCursor } from '@/server/queries/recipes';

const CursorSchema = z.object({
  sortOrder: z.number(),
  id: z.string(),
});

const LoadMoreProductsInputSchema = z.object({
  categorySlug: z.string().optional(),
  q: z.string().optional(),
  cursor: CursorSchema.nullable().optional(),
  skip: z.number().int().min(0).optional(),
  take: z.number().int().min(1).max(50).default(12),
});

const LoadMoreRecipesInputSchema = z.object({
  categorySlug: z.string().optional(),
  serving: z.enum(['cold', 'hot']).optional(),
  q: z.string().optional(),
  cursor: CursorSchema.nullable().optional(),
  skip: z.number().int().min(0).optional(),
  take: z.number().int().min(1).max(50).default(12),
});

export type LoadMoreProductsInput = z.infer<typeof LoadMoreProductsInputSchema>;
export type LoadMoreRecipesInput = z.infer<typeof LoadMoreRecipesInputSchema>;

export interface LoadMoreResult<T, C> {
  success: boolean;
  items?: T[];
  nextCursor?: C | null;
  hasMore?: boolean;
  total?: number;
  error?: string;
}

export async function loadMoreProductsAction(
  rawInput: LoadMoreProductsInput
): Promise<LoadMoreResult<ProductCardViewModel, ProductCursor>> {
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

    const rateResult = checkRateLimit(`rate_products_load_${clientIp}`, {
      windowMs: 60 * 1000,
      maxAttempts: 60,
    });

    if (!rateResult.success) {
      return {
        success: false,
        error: 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.',
      };
    }

    const parsed = LoadMoreProductsInputSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: 'پارامترهای درخواست نامعتبر است.',
      };
    }

    const { categorySlug, q, cursor, skip, take } = parsed.data;

    const result = await getPublicProducts({
      categorySlug,
      q,
      cursor,
      skip,
      take,
    });

    return {
      success: true,
      items: result.items,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
      total: result.total,
    };
  } catch (error) {
    console.error('loadMoreProductsAction error:', error);
    return {
      success: false,
      error: 'خطا در بارگذاری موارد بیشتر.',
    };
  }
}

export async function loadMoreRecipesAction(
  rawInput: LoadMoreRecipesInput
): Promise<LoadMoreResult<RecipeCardViewModel, RecipeCursor>> {
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

    const rateResult = checkRateLimit(`rate_recipes_load_${clientIp}`, {
      windowMs: 60 * 1000,
      maxAttempts: 60,
    });

    if (!rateResult.success) {
      return {
        success: false,
        error: 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.',
      };
    }

    const parsed = LoadMoreRecipesInputSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: 'پارامترهای درخواست نامعتبر است.',
      };
    }

    const { categorySlug, serving, q, cursor, skip, take } = parsed.data;

    const result = await getPublicRecipes({
      categorySlug,
      serving,
      q,
      cursor,
      skip,
      take,
    });

    return {
      success: true,
      items: result.items,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
      total: result.total,
    };
  } catch (error) {
    console.error('loadMoreRecipesAction error:', error);
    return {
      success: false,
      error: 'خطا در بارگذاری موارد بیشتر.',
    };
  }
}
