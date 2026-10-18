/**
 * Product Domain Service (Phase 4, Task 2 & 5)
 * Manages Product CRUD, order options, slug redirect maintenance,
 * category isolation (PRODUCT only), search text indexing, and optimistic concurrency.
 */

import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '@/server/db/client';
import { ProductInput, productInputSchema } from '@/server/validation';
import { buildProductSearchText } from '@/server/services/search-text';
import { recordAuditLog } from '@/server/services/audit-log-service';
import { resolveSlugCollision } from '@/lib/domain-utils';
import { uiStringsFa } from '@/content/ui-strings.fa';
import { deletePhysicalImageFile, deleteMediaAsset } from '@/server/services/media-service';
import { findMediaAssetReferences } from '@/server/services/media-reference-tracker';

export class ConcurrencyConflictError extends Error {
  constructor(message = 'این مورد از زمان باز شدن توسط کاربر دیگری ویرایش شده است.') {
    super(message);
    this.name = 'ConcurrencyConflictError';
  }
}

export interface ProductListFilters {
  search?: string;
  status?: string;
  categorySlug?: string;
  isAvailable?: boolean;
  skip?: number;
  take?: number;
}

export class ProductService {
  /**
   * Forcefully purges Next.js caches across homepage, listings, layouts, and dynamic detail pages.
   */
  static revalidateAllProductPaths(slug?: string, id?: string) {
    try {
      revalidateTag('products', 'max');
      if (id) {
        revalidateTag(`product-${id}`, 'max');
      }
      revalidatePath('/', 'layout');
      revalidatePath('/products', 'layout');
      revalidatePath('/recipes', 'layout');
      revalidatePath('/admin/products', 'layout');
      revalidatePath('/');
      revalidatePath('/products');
      revalidatePath('/recipes');
      revalidatePath('/admin/products');
      if (slug) {
        revalidatePath(`/products/${slug}`);
      }
    } catch {}
  }

  /**
   * Validates that all categoryIds belong strictly to PRODUCT categories.
   */
  static async validateProductCategories(categoryIds: string[], requireActive = false): Promise<{ id: string; name: string }[]> {
    if (!categoryIds || categoryIds.length === 0) return [];

    const categories = await db.category.findMany({
      where: { id: { in: categoryIds } },
    });

    for (const cat of categories) {
      if (cat.type !== 'PRODUCT') {
        throw new Error(
          `${uiStringsFa.validation.categoryTypeMismatch}: دسته‌بندی «${cat.name}» از نوع محصول نیست.`
        );
      }
      if (requireActive && cat.status === 'ARCHIVED') {
        throw new Error(`دسته‌بندی «${cat.name}» بایگانی شده است و نمی‌تواند به محصول جدید تخصیص یابد.`);
      }
    }

    return categories.map((c: any) => ({ id: c.id, name: c.name }));
  }

  /**
   * Lists products with comprehensive filtering and option count calculation.
   */
  static async listProducts(filters: ProductListFilters = {}) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.isAvailable !== undefined) {
      where.isAvailable = filters.isAvailable;
    }
    if (filters.categorySlug && filters.categorySlug !== 'all' && filters.categorySlug !== 'همه') {
      where.categories = {
        some: {
          category: {
            slug: filters.categorySlug,
          },
        },
      };
    }
    if (filters.search) {
      where.searchQuery = filters.search;
    }

    const items = await db.product.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      skip: filters.skip,
      take: filters.take,
      include: {
        categories: true,
        mainImage: true,
        options: true,
        _count: {
          select: { options: true },
        },
      },
    });

    const totalCount = await db.product.count({ where });

    return {
      items: items.map((p: any) => ({
        ...p,
        optionCount: Array.isArray(p.options)
          ? p.options.length
          : (p._count?.options ?? 0),
      })),
      totalCount,
    };
  }

  /**
   * Gets single product by ID with full relations.
   */
  static async getProductById(id: string) {
    return await db.product.findUnique({
      where: { id },
      include: {
        categories: true,
        mainImage: true,
        gallery: { include: { asset: true }, orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  /**
   * Creates a new product, validating categories, checking slug uniqueness,
   * building searchText, and recording an audit entry.
   */
  static async createProduct(rawInput: ProductInput, userId?: string) {
    const validated = productInputSchema.parse(rawInput);

    // Enforce category constraint: PRODUCT categories only (active only for new creations)
    const categories = await this.validateProductCategories(validated.categoryIds, true);
    const categoryNames = categories.map((c) => c.name);

    // Slug uniqueness check
    const existingSlug = await db.product.findUnique({ where: { slug: validated.slug } });
    if (existingSlug) {
      throw new Error(`محصولی با شناسه لاتین «${validated.slug}» از قبل وجود دارد.`);
    }

    // Circular redirect loop prevention
    try {
      await db.slugRedirect.deleteMany({
        where: {
          entityType: 'PRODUCT',
          oldSlug: validated.slug,
        },
      });
    } catch {}

    // Compute normalized search text
    const searchText = buildProductSearchText({
      nameFa: validated.nameFa,
      nameOriginal: validated.nameOriginal,
      foodNature: validated.foodNature,
      vitamins: validated.vitamins,
      harvestSeason: validated.harvestSeason,
      harvestPlace: validated.harvestPlace,
      color: validated.color,
      usageWarning: validated.usageWarning,
      benefits: validated.benefits,
      categoryNames,
    });

    const created = await db.product.create({
      data: {
        nameFa: validated.nameFa,
        nameOriginal: validated.nameOriginal || null,
        slug: validated.slug,
        status: validated.status,
        isAvailable: validated.isAvailable,
        isFeatured: validated.isFeatured,
        cardTheme: validated.cardTheme,
        sortOrder: validated.sortOrder,
        shortDescription: validated.shortDescription || null,
        description: validated.description || null,
        foodNature: validated.foodNature || null,
        vitamins: validated.vitamins || null,
        harvestSeason: validated.harvestSeason || null,
        harvestPlace: validated.harvestPlace || null,
        color: validated.color || null,
        usageWarning: validated.usageWarning || null,
        benefits: validated.benefits,
        options: validated.options.map((opt, idx) => ({
          id: opt.id || `opt_${Date.now()}_${idx}`,
          label: opt.label,
          isAvailable: opt.isAvailable,
          sortOrder: opt.sortOrder ?? idx,
        })),
        categoryIds: validated.categoryIds,
        categorySlug: categories[0]?.id?.replace('cat_', '') || 'honey-types',
        mainImageId: validated.mainImageId || null,
        focalPoint: validated.focalPoint || 'center',
        searchText,
      },
      include: { categories: true, mainImage: true },
    });

    if (validated.galleryAssetIds && validated.galleryAssetIds.length > 0) {
      try {
        for (let i = 0; i < validated.galleryAssetIds.length; i++) {
          await db.productGalleryItem.create({
            data: {
              productId: created.id,
              assetId: validated.galleryAssetIds[i],
              sortOrder: i,
            },
          });
        }
      } catch (err) {
        console.error('Failed to create product gallery items:', err);
      }
    }

    ProductService.revalidateAllProductPaths(created.slug, created.id);

    await recordAuditLog({
      userId,
      action: 'PRODUCT_CREATE',
      entityType: 'Product',
      entityId: created.id,
      summary: `Created product «${created.nameFa}» (${created.slug}) with ${validated.options.length} options`,
    });

    return created;
  }

  /**
   * Updates an existing product with optimistic concurrency conflict detection
   * and automatic SlugRedirect generation upon slug changes.
   */
  static async updateProduct(
    id: string,
    rawInput: Partial<ProductInput>,
    expectedUpdatedAt?: string | Date,
    userId?: string
  ) {
    const existing = await db.product.findUniqueOrThrow({
      where: { id },
      include: { categories: true },
    });

    // Optimistic Concurrency Control
    if (expectedUpdatedAt && existing.updatedAt) {
      const existingTime = new Date(existing.updatedAt).getTime();
      const expectedTime = new Date(expectedUpdatedAt).getTime();
      if (Math.abs(existingTime - expectedTime) > 1000) {
        throw new ConcurrencyConflictError(
          'این محصول از زمان بارگذاری توسط کاربر دیگری تغییر یافته است. لطفاً صفحه را تازه‌سازی نمایید.'
        );
      }
    }

    // Slug Redirect Maintenance
    const oldSlug = existing.slug;
    const newSlug = rawInput.slug ?? existing.slug;

    if (rawInput.slug && rawInput.slug !== oldSlug) {
      const conflict = await db.product.findUnique({ where: { slug: newSlug } });
      if (conflict && conflict.id !== id) {
        throw new Error(`محصول دیگری با شناسه لاتین «${newSlug}» ثبت شده است.`);
      }

      // Circular redirect loop prevention
      try {
        await db.slugRedirect.deleteMany({
          where: {
            entityType: 'PRODUCT',
            oldSlug: newSlug,
          },
        });
      } catch {}

      // Create permanent 301 redirect entry
      await db.slugRedirect.create({
        data: {
          entityType: 'PRODUCT',
          oldSlug,
          targetId: id,
        },
      });
    }

    const categoryIds = rawInput.categoryIds ?? existing.categoryIds ?? [];
    const categories = await this.validateProductCategories(categoryIds);
    const categoryNames = categories.map((c) => c.name);

    const nameFa = rawInput.nameFa ?? existing.nameFa;
    const nameOriginal = rawInput.nameOriginal !== undefined ? rawInput.nameOriginal : existing.nameOriginal;
    const foodNature = rawInput.foodNature !== undefined ? rawInput.foodNature : existing.foodNature;
    const vitamins = rawInput.vitamins !== undefined ? rawInput.vitamins : existing.vitamins;
    const harvestSeason = rawInput.harvestSeason !== undefined ? rawInput.harvestSeason : existing.harvestSeason;
    const harvestPlace = rawInput.harvestPlace !== undefined ? rawInput.harvestPlace : existing.harvestPlace;
    const color = rawInput.color !== undefined ? rawInput.color : existing.color;
    const usageWarning = rawInput.usageWarning !== undefined ? rawInput.usageWarning : existing.usageWarning;
    const benefits = rawInput.benefits ?? existing.benefits ?? [];
    const options = rawInput.options ?? existing.options ?? [];

    const searchText = buildProductSearchText({
      nameFa,
      nameOriginal,
      foodNature,
      vitamins,
      harvestSeason,
      harvestPlace,
      color,
      usageWarning,
      benefits,
      categoryNames,
    });

    // Changed field detection for audit log
    const changedFields: string[] = [];
    if (rawInput.nameFa && rawInput.nameFa !== existing.nameFa) changedFields.push('nameFa');
    if (rawInput.slug && rawInput.slug !== existing.slug) changedFields.push('slug');
    if (rawInput.status && rawInput.status !== existing.status) changedFields.push('status');
    if (rawInput.isAvailable !== undefined && rawInput.isAvailable !== existing.isAvailable) changedFields.push('isAvailable');
    if (rawInput.options) changedFields.push('options');
    if (rawInput.benefits) changedFields.push('benefits');
    if (rawInput.galleryAssetIds) changedFields.push('gallery');

    // Clean up old mainImage files and orphan asset if main image is being replaced
    if (rawInput.mainImageId !== undefined && rawInput.mainImageId !== existing.mainImageId) {
      if (existing.mainImageId) {
        try {
          const refs = await findMediaAssetReferences(existing.mainImageId);
          const otherRefs = refs.filter((r) => !(r.entityType === 'Product' && r.entityId === id));
          if (otherRefs.length === 0) {
            await deleteMediaAsset(existing.mainImageId);
          }
        } catch (cleanupErr) {
          console.warn('Non-critical: Failed to cleanup previous mainImage asset:', cleanupErr);
        }
      }
      const legacyImageUrl =
        (existing as any).imageUrl ||
        (typeof (existing as any).mainImage === 'string' ? (existing as any).mainImage : null);
      if (legacyImageUrl && typeof legacyImageUrl === 'string' && legacyImageUrl.includes('/uploads/')) {
        try {
          await deletePhysicalImageFile(legacyImageUrl);
        } catch {}
      }
    }

    const updated = await db.product.update({
      where: { id },
      data: {
        nameFa,
        nameOriginal,
        slug: newSlug,
        status: rawInput.status ?? existing.status,
        isAvailable: rawInput.isAvailable ?? existing.isAvailable,
        isFeatured: rawInput.isFeatured ?? existing.isFeatured,
        cardTheme: rawInput.cardTheme ?? existing.cardTheme,
        sortOrder: rawInput.sortOrder ?? existing.sortOrder,
        shortDescription: rawInput.shortDescription !== undefined ? rawInput.shortDescription : existing.shortDescription,
        description: rawInput.description !== undefined ? rawInput.description : existing.description,
        foodNature,
        vitamins,
        harvestSeason,
        harvestPlace,
        color,
        usageWarning,
        benefits,
        options,
        categoryIds,
        categorySlug: categories[0]?.id?.replace('cat_', '') || existing.categorySlug,
        mainImageId: rawInput.mainImageId !== undefined ? rawInput.mainImageId : existing.mainImageId,
        focalPoint: rawInput.focalPoint !== undefined ? rawInput.focalPoint : ((existing as any).focalPoint || 'center'),
        searchText,
      },
      include: { categories: true, mainImage: true },
    });

    if (rawInput.galleryAssetIds !== undefined) {
      try {
        await db.productGalleryItem.deleteMany({ where: { productId: id } });
        if (Array.isArray(rawInput.galleryAssetIds) && rawInput.galleryAssetIds.length > 0) {
          for (let i = 0; i < rawInput.galleryAssetIds.length; i++) {
            await db.productGalleryItem.create({
              data: {
                productId: id,
                assetId: rawInput.galleryAssetIds[i],
                sortOrder: i,
              },
            });
          }
        }
      } catch (err) {
        console.error('Failed to update product gallery items:', err);
      }
    }

    ProductService.revalidateAllProductPaths(newSlug, id);

    await recordAuditLog({
      userId,
      action: 'PRODUCT_UPDATE',
      entityType: 'Product',
      entityId: id,
      summary: `Updated product «${updated.nameFa}» (changed: ${changedFields.join(', ') || 'none'})`,
    });

    return updated;
  }

  /**
   * Quick toggle of product availability from list view.
   */
  static async toggleProductAvailability(id: string, isAvailable: boolean, userId?: string) {
    const existing = await db.product.findUniqueOrThrow({ where: { id } });

    const updated = await db.product.update({
      where: { id },
      data: { isAvailable },
    });

    ProductService.revalidateAllProductPaths(existing.slug, id);

    await recordAuditLog({
      userId,
      action: 'PRODUCT_AVAILABILITY_CHANGE',
      entityType: 'Product',
      entityId: id,
      summary: `Changed product «${existing.nameFa}» availability to ${isAvailable ? 'موجود' : 'ناموجود'}`,
    });

    return updated;
  }

  /**
   * Duplicates an existing product, copying order options and benefits in DRAFT mode.
   */
  static async duplicateProduct(id: string, userId?: string) {
    const source = await db.product.findUniqueOrThrow({ where: { id } });

    const allProducts = await db.product.findMany();
    const existingSlugs = allProducts.map((p: any) => p.slug);
    const newSlug = resolveSlugCollision(`${source.slug}-copy`, existingSlugs);

    const duplicated = await db.product.create({
      data: {
        ...source,
        id: undefined,
        nameFa: `${source.nameFa} (کپی)`,
        slug: newSlug,
        status: 'DRAFT',
        isFeatured: false,
        options: (source.options || []).map((o: any, idx: number) => ({
          ...o,
          id: `opt_${Date.now()}_${idx}`,
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    ProductService.revalidateAllProductPaths(duplicated.slug, duplicated.id);

    await recordAuditLog({
      userId,
      action: 'PRODUCT_DUPLICATE',
      entityType: 'Product',
      entityId: duplicated.id,
      summary: `Duplicated product «${source.nameFa}» into new draft «${duplicated.nameFa}» (${duplicated.slug})`,
    });

    return duplicated;
  }

  /**
   * Hard-deletes a product after confirmation.
   */
  static async deleteProduct(id: string, userId?: string) {
    const existing = await db.product.findUniqueOrThrow({ where: { id } });

    const deleted = await db.product.delete({ where: { id } });

    ProductService.revalidateAllProductPaths(existing.slug, id);

    await recordAuditLog({
      userId,
      action: 'PRODUCT_DELETE',
      entityType: 'Product',
      entityId: id,
      summary: `Deleted product «${existing.nameFa}» (${existing.slug})`,
    });

    return deleted;
  }

  /**
   * Bulk deletes multiple products in a single operation.
   */
  static async bulkDeleteProducts(ids: string[], userId?: string) {
    if (!ids || ids.length === 0) return { count: 0 };
    const res = await db.product.deleteMany({
      where: { id: { in: ids } },
    });
    const deletedCount = res?.count ?? 0;

    ProductService.revalidateAllProductPaths();

    await recordAuditLog({
      userId,
      action: 'PRODUCT_BULK_DELETE',
      entityType: 'Product',
      entityId: ids.join(','),
      summary: `حذف دسته‌ای ${deletedCount} محصول`,
    });

    return { count: deletedCount };
  }

  /**
   * Bulk updates product availability in a single operation.
   */
  static async bulkToggleProductAvailability(ids: string[], isAvailable: boolean, userId?: string) {
    if (!ids || ids.length === 0) return { count: 0 };
    const res = await db.product.updateMany({
      where: { id: { in: ids } },
      data: { isAvailable },
    });
    const updatedCount = res?.count ?? 0;

    ProductService.revalidateAllProductPaths();

    await recordAuditLog({
      userId,
      action: 'PRODUCT_BULK_AVAILABILITY_CHANGE',
      entityType: 'Product',
      entityId: ids.join(','),
      summary: `تغییر وضعیت موجودی دسته‌ای ${updatedCount} محصول به ${isAvailable ? 'موجود' : 'ناموجود'}`,
    });

    return { count: updatedCount };
  }
}
