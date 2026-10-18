/**
 * Category Domain Service (Phase 4, Task 1 & 5)
 * Manages category CRUD, type enforcement, item counting, and deletion protection.
 */

import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '@/server/db/client';
import { CategoryInput, categoryInputSchema } from '@/server/validation';
import { recordAuditLog } from '@/server/services/audit-log-service';
import { uiStringsFa } from '@/content/ui-strings.fa';

export class CategoryService {
  /**
   * Lists categories optionally filtered by type with linked item counts.
   */
  static async listCategories(type?: 'PRODUCT' | 'RECIPE') {
    const where: any = {};
    if (type) where.type = type;
    return await db.category.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Gets category by ID.
   */
  static async getCategoryById(id: string) {
    return await db.category.findUnique({ where: { id } });
  }

  /**
   * Creates a new category.
   */
  static async createCategory(rawInput: CategoryInput, userId?: string) {
    const validated = categoryInputSchema.parse(rawInput);

    // Check slug uniqueness per category type
    const existing = await db.category.findUnique({
      where: { type_slug: { type: validated.type, slug: validated.slug } },
    });

    if (existing) {
      throw new Error(`دسته‌بندی با شناسه «${validated.slug}» در بخش ${validated.type === 'PRODUCT' ? 'محصولات' : 'دستورها'} از قبل وجود دارد.`);
    }

    const category = await db.category.create({
      data: {
        name: validated.name,
        slug: validated.slug,
        type: validated.type,
        status: validated.status,
        sortOrder: validated.sortOrder,
      },
    });

    // Revalidate caches
    try {
      revalidateTag('categories', 'max');
      revalidatePath('/admin/categories');
    } catch {}

    // Audit log
    await recordAuditLog({
      userId,
      action: 'CATEGORY_CREATE',
      entityType: 'Category',
      entityId: category.id,
      summary: `Created category «${category.name}» (${category.type}) with slug ${category.slug}`,
    });

    return category;
  }

  /**
   * Updates an existing category.
   */
  static async updateCategory(id: string, rawInput: Partial<CategoryInput>, userId?: string) {
    const existing = await db.category.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('دسته‌بندی مورد نظر یافت نشد.');
    }

    const type = rawInput.type ?? existing.type;
    const slug = rawInput.slug ?? existing.slug;

    if (rawInput.slug && rawInput.slug !== existing.slug) {
      const conflict = await db.category.findUnique({
        where: { type_slug: { type, slug } },
      });
      if (conflict && conflict.id !== id) {
        throw new Error(`دسته‌بندی با شناسه «${slug}» قبلاً ثبت شده است.`);
      }
    }

    // Detect changed fields
    const changedFields: string[] = [];
    if (rawInput.name && rawInput.name !== existing.name) changedFields.push('name');
    if (rawInput.slug && rawInput.slug !== existing.slug) changedFields.push('slug');
    if (rawInput.status && rawInput.status !== existing.status) changedFields.push('status');
    if (rawInput.sortOrder !== undefined && rawInput.sortOrder !== existing.sortOrder) changedFields.push('sortOrder');

    const updated = await db.category.update({
      where: { id },
      data: {
        name: rawInput.name ?? existing.name,
        slug,
        type,
        status: rawInput.status ?? existing.status,
        sortOrder: rawInput.sortOrder ?? existing.sortOrder,
      },
    });

    // Revalidate caches
    try {
      revalidateTag('categories', 'max');
      revalidateTag(type === 'PRODUCT' ? 'products' : 'recipes', 'max');
      revalidatePath('/admin/categories');
    } catch {}

    // Audit log
    await recordAuditLog({
      userId,
      action: 'CATEGORY_UPDATE',
      entityType: 'Category',
      entityId: updated.id,
      summary: `Updated category «${updated.name}» (changed: ${changedFields.join(', ') || 'none'})`,
    });

    return updated;
  }

  /**
   * Toggles category status between ACTIVE and ARCHIVED.
   */
  static async toggleCategoryStatus(id: string, status: 'ACTIVE' | 'ARCHIVED', userId?: string) {
    return this.updateCategory(id, { status }, userId);
  }

  /**
   * Deletes a category ONLY if it is not used by any products or recipes.
   */
  static async deleteCategory(id: string, userId?: string) {
    const category = await db.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
            recipes: true,
          },
        },
      },
    });
    if (!category) {
      throw new Error('دسته‌بندی یافت نشد.');
    }

    // Strict in-use guard preventing catastrophic cascade deletions
    const linkedProducts = (category as any)._count?.products ?? (category as any).productCount ?? 0;
    const linkedRecipes = (category as any)._count?.recipes ?? (category as any).recipeCount ?? 0;

    let isUsed = linkedProducts > 0 || linkedRecipes > 0;

    // Double-check junction relations directly if _count wasn't populated
    if (!isUsed) {
      try {
        const [pCount, rCount] = await Promise.all([
          db.productCategory?.count ? db.productCategory.count({ where: { categoryId: id } }) : 0,
          db.recipeCategory?.count ? db.recipeCategory.count({ where: { categoryId: id } }) : 0,
        ]);
        if (pCount > 0 || rCount > 0) {
          isUsed = true;
        }
      } catch {}
    }

    if (isUsed) {
      throw new Error(
        'این دسته‌بندی دارای اقلام متصل است و نمی‌تواند حذف شود. ابتدا آن را بایگانی کنید یا اقلام متصل به آن را حذف نمایید.'
      );
    }

    const deleted = await db.category.delete({ where: { id } });

    try {
      revalidateTag('categories', 'max');
      revalidatePath('/admin/categories');
    } catch {}

    await recordAuditLog({
      userId,
      action: 'CATEGORY_DELETE',
      entityType: 'Category',
      entityId: id,
      summary: `Deleted category «${deleted.name}» (${deleted.type})`,
    });

    return deleted;
  }
}
