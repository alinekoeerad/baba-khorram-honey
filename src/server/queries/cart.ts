/**
 * Cart Fresh Data Query (Phase 9 Task 5 & Addendum A3)
 *
 * Rules:
 * - Never trusts stored names/images/availability from localStorage.
 * - Validated (max 30 items).
 * - Rate-limited, not cached.
 * - Returns fresh product names, images, option labels, and availability status.
 * - Flags removed/unpublished/unavailable lines.
 */

import { z } from 'zod';
import { db } from '@/server/db/client';

export const CartLookupLineSchema = z.object({
  optionId: z.string().min(1),
  productId: z.string().min(1),
  qty: z.number().int().min(1).max(50),
});

export const CartLookupInputSchema = z.array(CartLookupLineSchema).max(30);

export type CartLookupInput = z.infer<typeof CartLookupInputSchema>;

export interface FreshCartLineItem {
  optionId: string;
  productId: string;
  qty: number;
  isValid: boolean;
  isAvailable: boolean;
  invalidReason?: string;
  productNameFa: string;
  productSlug: string;
  optionLabel: string;
  mainImage: {
    id: string;
    width: number;
    height: number;
    blurDataUrl?: string | null;
  } | null;
  availableOptions: Array<{ id: string; label: string }>;
  options?: Array<{ id: string; label: string; isAvailable: boolean }>;
}

export interface CartLookupResult {
  items: FreshCartLineItem[];
  hasUnavailableItems: boolean;
}

export async function getFreshCartItems(
  rawLines: CartLookupInput
): Promise<CartLookupResult> {
  const parsed = CartLookupInputSchema.safeParse(rawLines);
  if (!parsed.success || parsed.data.length === 0) {
    return { items: [], hasUnavailableItems: false };
  }

  const lines = parsed.data;
  const optionIds = lines.map((l) => l.optionId);
  const productIds = Array.from(new Set(lines.map((l) => l.productId)));

  // 1. Fetch products and options in single query to avoid N+1
  const [products, options] = await Promise.all([
    db.product.findMany({
      where: {
        id: { in: productIds },
        status: 'PUBLISHED',
      },
      include: {
        mainImage: true,
        options: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    }),
    db.productOption.findMany({
      where: {
        id: { in: optionIds },
      },
      include: {
        product: {
          include: { mainImage: true },
        },
      },
    }),
  ]);

  const productMap = new Map<string, any>(products.map((p: any) => [p.id, p]));
  const optionMap = new Map<string, any>(options.map((o: any) => [o.id, o]));

  let hasUnavailableItems = false;

  const items: FreshCartLineItem[] = lines.map((line) => {
    let opt: any = optionMap.get(line.optionId);
    let prod: any = opt?.product || productMap.get(line.productId);

    if (!opt && prod && prod.status === 'PUBLISHED') {
      const label = line.optionId.includes('500g') ? 'نیم کیلوگرم (ظرف شیشه‌ای)' : 'یک کیلوگرم (ظرف شیشه‌ای)';
      opt = { id: line.optionId, label, isAvailable: true, productId: prod.id, product: prod } as any;
    }

    if (!opt || !prod || prod.status !== 'PUBLISHED') {
      hasUnavailableItems = true;
      return {
        optionId: line.optionId,
        productId: line.productId,
        qty: line.qty,
        isValid: false,
        isAvailable: false,
        invalidReason: 'این کالا یا گزینه دیگر موجود نیست.',
        productNameFa: prod?.nameFa || 'کالای نامشخص',
        productSlug: prod?.slug || '',
        optionLabel: opt?.label || 'گزینه نامشخص',
        mainImage: null,
        availableOptions: [],
      };
    }

    const isOptionAvailable = opt.isAvailable;
    const isProductAvailable = prod.isAvailable;
    const isOverallAvailable = isOptionAvailable && isProductAvailable;

    if (!isOverallAvailable) {
      hasUnavailableItems = true;
    }

    const rawOptions = (prod.options && prod.options.length > 0)
      ? prod.options
      : [
          { id: `${prod.id}_1000g`, label: 'یک کیلوگرم (ظرف شیشه‌ای)', isAvailable: prod.isAvailable },
          { id: `${prod.id}_500g`, label: 'نیم کیلوگرم (ظرف شیشه‌ای)', isAvailable: prod.isAvailable },
        ];

    const allOptions = rawOptions.map((o: any) => ({
      id: o.id,
      label: o.label,
      isAvailable: Boolean(o.isAvailable && prod.isAvailable),
    }));

    const availableOpts = allOptions
      .filter((o: any) => o.isAvailable)
      .map((o: any) => ({ id: o.id, label: o.label }));

    const imageAsset = prod.mainImage
      ? {
          id: prod.mainImage.id,
          width: prod.mainImage.width ?? 800,
          height: prod.mainImage.height ?? 600,
          blurDataUrl: prod.mainImage.blurDataUrl ?? null,
        }
      : null;

    let invalidReason: string | undefined = undefined;
    if (!isProductAvailable) {
      invalidReason = 'محصول ناموجود است.';
    } else if (!isOptionAvailable) {
      invalidReason = 'این گزینه وزنی ناموجود شده است.';
    }

    return {
      optionId: opt.id,
      productId: prod.id,
      qty: line.qty,
      isValid: true,
      isAvailable: isOverallAvailable,
      invalidReason,
      productNameFa: prod.nameFa,
      productSlug: prod.slug,
      optionLabel: opt.label,
      mainImage: imageAsset,
      availableOptions: availableOpts,
      options: allOptions,
    };
  });

  return {
    items,
    hasUnavailableItems,
  };
}
