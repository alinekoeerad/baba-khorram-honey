import { describe, it, expect } from 'vitest';
import { isMediaAssetReferenced } from '@/server/services/media-reference-tracker';
import { db } from '@/server/db/client';

describe('Media Reference Tracker Database Tests', () => {
  it('detects when an asset is referenced by a Product mainImageId and handles cleanup', async () => {
    const testAssetId = 'test_asset_' + Date.now();
    const testProduct = await db.product.create({
      data: {
        nameFa: 'محصول تست رسانه',
        slug: 'test-media-product-' + Date.now(),
        status: 'DRAFT',
        mainImageId: testAssetId,
        categoryIds: [],
        benefits: [],
        options: [],
      } as any,
    });

    const isRef = await isMediaAssetReferenced(testAssetId);
    expect(isRef).toBe(true);

    // Clean up product
    await db.product.delete({ where: { id: testProduct.id } });

    const isRefAfterDelete = await isMediaAssetReferenced(testAssetId);
    expect(isRefAfterDelete).toBe(false);
  });

  it('confirms an unreferenced temporary asset is marked safe to clean up', async () => {
    const isRef = await isMediaAssetReferenced('non_existent_orphan_asset_id_' + Date.now());
    expect(isRef).toBe(false);
  });
});
