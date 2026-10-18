/**
 * Recipe Domain Service (Phase 4, Task 3 & 5)
 * Manages Recipe CRUD, serving types, ingredient and step lists,
 * category isolation (RECIPE only), search text indexing, and optimistic concurrency.
 */

import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '@/server/db/client';
import { RecipeInput, recipeInputSchema } from '@/server/validation';
import { buildRecipeSearchText } from '@/server/services/search-text';
import { recordAuditLog } from '@/server/services/audit-log-service';
import { resolveSlugCollision } from '@/lib/domain-utils';
import { ConcurrencyConflictError } from '@/server/services/product-service';
import { uiStringsFa } from '@/content/ui-strings.fa';
import { deletePhysicalImageFile, deleteMediaAsset } from '@/server/services/media-service';
import { findMediaAssetReferences } from '@/server/services/media-reference-tracker';

export interface RecipeListFilters {
  search?: string;
  status?: string;
  categorySlug?: string;
  skip?: number;
  take?: number;
}

export class RecipeService {
  /**
   * Forcefully purges Next.js caches across homepage, listings, layouts, and dynamic detail pages.
   */
  static revalidateAllRecipePaths(slug?: string, id?: string) {
    try {
      revalidateTag('recipes', 'max');
      if (id) {
        revalidateTag(`recipe-${id}`, 'max');
      }
      revalidatePath('/', 'layout');
      revalidatePath('/recipes', 'layout');
      revalidatePath('/products', 'layout');
      revalidatePath('/admin/recipes', 'layout');
      revalidatePath('/');
      revalidatePath('/products');
      revalidatePath('/recipes');
      revalidatePath('/admin/recipes');
      if (slug) {
        revalidatePath(`/recipes/${slug}`);
      }
    } catch {}
  }

  /**
   * Validates that all categoryIds belong strictly to RECIPE categories.
   */
  static async validateRecipeCategories(categoryIds: string[], requireActive = false): Promise<{ id: string; name: string }[]> {
    if (!categoryIds || categoryIds.length === 0) return [];

    const categories = await db.category.findMany({
      where: { id: { in: categoryIds } },
    });

    for (const cat of categories) {
      if (cat.type !== 'RECIPE') {
        throw new Error(
          `${uiStringsFa.validation.categoryTypeMismatch}: دسته‌بندی «${cat.name}» از نوع دستور پخت نیست.`
        );
      }
      if (requireActive && cat.status === 'ARCHIVED') {
        throw new Error(`دسته‌بندی «${cat.name}» بایگانی شده است و نمی‌تواند به دستور جدید تخصیص یابد.`);
      }
    }

    return categories.map((c: any) => ({ id: c.id, name: c.name }));
  }

  /**
   * Lists recipes with filtering, sorting, and pagination.
   */
  static async listRecipes(filters: RecipeListFilters = {}) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.categorySlug) {
      where.categoryIds = { hasSome: [`cat_${filters.categorySlug}`] };
    }
    if (filters.search) {
      where.searchQuery = filters.search;
    }

    const items = await db.recipe.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      skip: filters.skip,
      take: filters.take,
      include: { categories: true, mainImage: true },
    });

    const totalCount = await db.recipe.count({ where });

    return {
      items,
      totalCount,
    };
  }

  /**
   * Gets single recipe by ID with full relations.
   */
  static async getRecipeById(id: string) {
    return await db.recipe.findUnique({
      where: { id },
      include: {
        categories: true,
        mainImage: true,
        gallery: { include: { asset: true }, orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  /**
   * Creates a new recipe.
   */
  static async createRecipe(rawInput: RecipeInput, userId?: string) {
    const validated = recipeInputSchema.parse(rawInput);

    // Enforce RECIPE category constraint (active only for new creations)
    const categories = await this.validateRecipeCategories(validated.categoryIds, true);
    const categoryNames = categories.map((c) => c.name);

    // Slug uniqueness check
    const existingSlug = await db.recipe.findUnique({ where: { slug: validated.slug } });
    if (existingSlug) {
      throw new Error(`دستوری با شناسه لاتین «${validated.slug}» از قبل وجود دارد.`);
    }

    // Circular redirect loop prevention
    try {
      await db.slugRedirect.deleteMany({
        where: {
          entityType: 'RECIPE',
          oldSlug: validated.slug,
        },
      });
    } catch {}

    const ingredientNames = validated.ingredients.map((i) => i.name);
    const ingredientNotes = validated.ingredients.map((i) => i.note).filter(Boolean) as string[];

    const searchText = buildRecipeSearchText({
      nameFa: validated.nameFa,
      nameOriginal: validated.nameOriginal,
      country: validated.country,
      yieldText: validated.yieldText,
      shortDescription: validated.shortDescription,
      longDescription: validated.longDescription,
      ingredientNames,
      ingredientNotes,
      categoryNames,
    });

    const created = await db.recipe.create({
      data: {
        nameFa: validated.nameFa,
        nameOriginal: validated.nameOriginal || null,
        slug: validated.slug,
        country: validated.country || null,
        servingTypes: validated.servingTypes,
        yieldText: validated.yieldText || null,
        shortDescription: validated.shortDescription || null,
        longDescription: validated.longDescription || null,
        status: validated.status,
        isFeatured: validated.isFeatured,
        cardTheme: validated.cardTheme,
        sortOrder: validated.sortOrder,
        ingredients: validated.ingredients.map((ing, idx) => ({
          ...ing,
          sortOrder: ing.sortOrder ?? idx,
        })),
        steps: validated.steps.map((st, idx) => ({
          ...st,
          sortOrder: st.sortOrder ?? idx,
        })),
        categoryIds: validated.categoryIds,
        mainImageId: validated.mainImageId || null,
        focalPoint: validated.focalPoint || 'center',
        searchText,
      },
      include: { categories: true, mainImage: true },
    });

    if (validated.galleryAssetIds && validated.galleryAssetIds.length > 0) {
      try {
        for (let i = 0; i < validated.galleryAssetIds.length; i++) {
          await db.recipeGalleryItem.create({
            data: {
              recipeId: created.id,
              assetId: validated.galleryAssetIds[i],
              sortOrder: i,
            },
          });
        }
      } catch (err) {
        console.error('Failed to create recipe gallery items:', err);
      }
    }

    RecipeService.revalidateAllRecipePaths(created.slug, created.id);

    await recordAuditLog({
      userId,
      action: 'RECIPE_CREATE',
      entityType: 'Recipe',
      entityId: created.id,
      summary: `Created recipe «${created.nameFa}» (${created.slug}) with ${validated.ingredients.length} ingredients`,
    });

    return created;
  }

  /**
   * Updates an existing recipe with optimistic concurrency conflict detection
   * and SlugRedirect creation on slug modifications.
   */
  static async updateRecipe(
    id: string,
    rawInput: Partial<RecipeInput>,
    expectedUpdatedAt?: string | Date,
    userId?: string
  ) {
    const existing = await db.recipe.findUniqueOrThrow({
      where: { id },
      include: { categories: true },
    });

    // Optimistic Concurrency Control
    if (expectedUpdatedAt && existing.updatedAt) {
      const existingTime = new Date(existing.updatedAt).getTime();
      const expectedTime = new Date(expectedUpdatedAt).getTime();
      if (Math.abs(existingTime - expectedTime) > 1000) {
        throw new ConcurrencyConflictError(
          'این دستور از زمان بارگذاری توسط کاربر دیگری تغییر یافته است. لطفاً صفحه را تازه‌سازی نمایید.'
        );
      }
    }

    const oldSlug = existing.slug;
    const newSlug = rawInput.slug ?? existing.slug;

    if (rawInput.slug && rawInput.slug !== oldSlug) {
      const conflict = await db.recipe.findUnique({ where: { slug: newSlug } });
      if (conflict && conflict.id !== id) {
        throw new Error(`دستور دیگری با شناسه لاتین «${newSlug}» ثبت شده است.`);
      }

      // Circular redirect loop prevention
      try {
        await db.slugRedirect.deleteMany({
          where: {
            entityType: 'RECIPE',
            oldSlug: newSlug,
          },
        });
      } catch {}

      // Create permanent 301 redirect entry
      await db.slugRedirect.create({
        data: {
          entityType: 'RECIPE',
          oldSlug,
          targetId: id,
        },
      });
    }

    const categoryIds = rawInput.categoryIds ?? existing.categoryIds ?? [];
    const categories = await this.validateRecipeCategories(categoryIds);
    const categoryNames = categories.map((c) => c.name);

    const nameFa = rawInput.nameFa ?? existing.nameFa;
    const nameOriginal = rawInput.nameOriginal !== undefined ? rawInput.nameOriginal : existing.nameOriginal;
    const country = rawInput.country !== undefined ? rawInput.country : existing.country;
    const yieldText = rawInput.yieldText !== undefined ? rawInput.yieldText : existing.yieldText;
    const shortDescription = rawInput.shortDescription !== undefined ? rawInput.shortDescription : existing.shortDescription;
    const longDescription = rawInput.longDescription !== undefined ? rawInput.longDescription : existing.longDescription;
    const servingTypes = rawInput.servingTypes ?? existing.servingTypes;
    const ingredients = rawInput.ingredients ?? existing.ingredients ?? [];
    const steps = rawInput.steps ?? existing.steps ?? [];

    const ingredientNames = ingredients.map((i: any) => i.name);
    const ingredientNotes = ingredients.map((i: any) => i.note).filter(Boolean) as string[];

    const searchText = buildRecipeSearchText({
      nameFa,
      nameOriginal,
      country,
      yieldText,
      shortDescription,
      longDescription,
      ingredientNames,
      ingredientNotes,
      categoryNames,
    });

    const changedFields: string[] = [];
    if (rawInput.nameFa && rawInput.nameFa !== existing.nameFa) changedFields.push('nameFa');
    if (rawInput.slug && rawInput.slug !== existing.slug) changedFields.push('slug');
    if (rawInput.status && rawInput.status !== existing.status) changedFields.push('status');
    if (rawInput.servingTypes) changedFields.push('servingTypes');
    if (rawInput.ingredients) changedFields.push('ingredients');
    if (rawInput.steps) changedFields.push('steps');

    // Clean up old mainImage files and orphan asset if main image is being replaced
    if (rawInput.mainImageId !== undefined && rawInput.mainImageId !== existing.mainImageId) {
      if (existing.mainImageId) {
        try {
          const refs = await findMediaAssetReferences(existing.mainImageId);
          const otherRefs = refs.filter((r) => !(r.entityType === 'Recipe' && r.entityId === id));
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

    const updated = await db.recipe.update({
      where: { id },
      data: {
        nameFa,
        nameOriginal,
        slug: newSlug,
        country,
        servingTypes,
        yieldText,
        shortDescription,
        longDescription,
        status: rawInput.status ?? existing.status,
        isFeatured: rawInput.isFeatured ?? existing.isFeatured,
        cardTheme: rawInput.cardTheme ?? existing.cardTheme,
        sortOrder: rawInput.sortOrder ?? existing.sortOrder,
        ingredients,
        steps,
        categoryIds,
        mainImageId: rawInput.mainImageId !== undefined ? rawInput.mainImageId : existing.mainImageId,
        focalPoint: rawInput.focalPoint !== undefined ? rawInput.focalPoint : ((existing as any).focalPoint || 'center'),
        searchText,
      },
      include: { categories: true, mainImage: true },
    });

    if (rawInput.galleryAssetIds !== undefined) {
      try {
        await db.recipeGalleryItem.deleteMany({ where: { recipeId: id } });
        if (Array.isArray(rawInput.galleryAssetIds) && rawInput.galleryAssetIds.length > 0) {
          for (let i = 0; i < rawInput.galleryAssetIds.length; i++) {
            await db.recipeGalleryItem.create({
              data: {
                recipeId: id,
                assetId: rawInput.galleryAssetIds[i],
                sortOrder: i,
              },
            });
          }
        }
      } catch (err) {
        console.error('Failed to update recipe gallery items:', err);
      }
    }

    RecipeService.revalidateAllRecipePaths(newSlug, id);

    await recordAuditLog({
      userId,
      action: 'RECIPE_UPDATE',
      entityType: 'Recipe',
      entityId: id,
      summary: `Updated recipe «${updated.nameFa}» (changed: ${changedFields.join(', ') || 'none'})`,
    });

    return updated;
  }

  /**
   * Duplicates an existing recipe into a new draft.
   */
  static async duplicateRecipe(id: string, userId?: string) {
    const source = await db.recipe.findUniqueOrThrow({ where: { id } });

    const allRecipes = await db.recipe.findMany();
    const existingSlugs = allRecipes.map((r: any) => r.slug);
    const newSlug = resolveSlugCollision(`${source.slug}-copy`, existingSlugs);

    const duplicated = await db.recipe.create({
      data: {
        ...source,
        id: undefined,
        nameFa: `${source.nameFa} (کپی)`,
        slug: newSlug,
        status: 'DRAFT',
        isFeatured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    RecipeService.revalidateAllRecipePaths(duplicated.slug, duplicated.id);

    await recordAuditLog({
      userId,
      action: 'RECIPE_DUPLICATE',
      entityType: 'Recipe',
      entityId: duplicated.id,
      summary: `Duplicated recipe «${source.nameFa}» into new draft «${duplicated.nameFa}» (${duplicated.slug})`,
    });

    return duplicated;
  }

  /**
   * Hard-deletes a recipe.
   */
  static async deleteRecipe(id: string, userId?: string) {
    const existing = await db.recipe.findUniqueOrThrow({ where: { id } });

    const deleted = await db.recipe.delete({ where: { id } });

    RecipeService.revalidateAllRecipePaths(existing.slug, id);

    await recordAuditLog({
      userId,
      action: 'RECIPE_DELETE',
      entityType: 'Recipe',
      entityId: id,
      summary: `Deleted recipe «${existing.nameFa}» (${existing.slug})`,
    });

    return deleted;
  }

  /**
   * Bulk deletes multiple recipes in a single operation.
   */
  static async bulkDeleteRecipes(ids: string[], userId?: string) {
    if (!ids || ids.length === 0) return { count: 0 };
    const res = await db.recipe.deleteMany({
      where: { id: { in: ids } },
    });
    const deletedCount = res?.count ?? 0;

    RecipeService.revalidateAllRecipePaths();

    await recordAuditLog({
      userId,
      action: 'RECIPE_BULK_DELETE',
      entityType: 'Recipe',
      entityId: ids.join(','),
      summary: `حذف دسته‌ای ${deletedCount} دستور پخت`,
    });

    return { count: deletedCount };
  }

  /**
   * Bulk updates recipe statuses in a single operation.
   */
  static async bulkUpdateRecipeStatus(
    ids: string[],
    status: 'PUBLISHED' | 'ARCHIVED' | 'DRAFT',
    userId?: string
  ) {
    if (!ids || ids.length === 0) return { count: 0 };
    const res = await db.recipe.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });
    const updatedCount = res?.count ?? 0;

    RecipeService.revalidateAllRecipePaths();

    await recordAuditLog({
      userId,
      action: 'RECIPE_BULK_STATUS_CHANGE',
      entityType: 'Recipe',
      entityId: ids.join(','),
      summary: `تغییر وضعیت دسته‌ای ${updatedCount} دستور پخت به ${status}`,
    });

    return { count: updatedCount };
  }
}
