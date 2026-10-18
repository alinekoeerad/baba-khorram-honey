/**
 * Recipe Server Actions (Phase 4, Task 3)
 * Admin-protected actions for recipe CRUD, ingredients, and steps.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/server/auth/require-admin';
import { RecipeService } from '@/server/services/recipe-service';
import { RecipeInput } from '@/server/validation';

function revalidateRecipePaths(slug?: string) {
  try {
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

export async function createRecipeAction(input: RecipeInput) {
  try {
    const { user } = await requireAdmin({ allowRedirect: false });
    const recipe = await RecipeService.createRecipe(input, user.id);
    revalidateRecipePaths(recipe?.slug);
    return { success: true, data: recipe };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطا در ایجاد دستور' };
  }
}

export async function updateRecipeAction(params: {
  id: string;
  input: Partial<RecipeInput>;
  expectedUpdatedAt?: string | Date;
}) {
  try {
    const { user } = await requireAdmin({ allowRedirect: false });
    const recipe = await RecipeService.updateRecipe(
      params.id,
      params.input,
      params.expectedUpdatedAt,
      user.id
    );
    revalidateRecipePaths(recipe?.slug);
    return { success: true, data: recipe };
  } catch (err: any) {
    const isConflict = err.name === 'ConcurrencyConflictError' || err?.message?.includes('دیگری ویرایش شده است');
    return { success: false, error: err.message || 'خطا در به‌روزرسانی دستور', isConflict };
  }
}

export async function duplicateRecipeAction(id: string) {
  try {
    const { user } = await requireAdmin({ allowRedirect: false });
    const duplicated = await RecipeService.duplicateRecipe(id, user.id);
    revalidateRecipePaths(duplicated?.slug);
    return { success: true, data: duplicated };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطا در کپی دستور' };
  }
}

export async function deleteRecipeAction(id: string) {
  try {
    const { user } = await requireAdmin({ allowRedirect: false });
    const deleted = await RecipeService.deleteRecipe(id, user.id);
    revalidateRecipePaths(deleted?.slug);
    return { success: true, data: deleted };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطا در حذف دستور' };
  }
}

export async function bulkDeleteRecipesAction(ids: string[]) {
  try {
    const { user } = await requireAdmin({ allowRedirect: false });
    const res = await RecipeService.bulkDeleteRecipes(ids, user.id);
    revalidateRecipePaths();
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطا در حذف دسته‌ای دستورها' };
  }
}

export async function bulkUpdateRecipeStatusAction(params: {
  ids: string[];
  status: 'PUBLISHED' | 'ARCHIVED' | 'DRAFT';
}) {
  try {
    const { user } = await requireAdmin({ allowRedirect: false });
    const res = await RecipeService.bulkUpdateRecipeStatus(
      params.ids,
      params.status,
      user.id
    );
    revalidateRecipePaths();
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطا در تغییر وضعیت دسته‌ای دستورها' };
  }
}
