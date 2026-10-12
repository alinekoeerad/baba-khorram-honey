/**
 * Recipe Server Actions (Phase 4, Task 3)
 * Admin-protected actions for recipe CRUD, ingredients, and steps.
 */

'use server';

import { requireAdmin } from '@/server/auth/require-admin';
import { RecipeService } from '@/server/services/recipe-service';
import { RecipeInput } from '@/server/validation';

export async function createRecipeAction(input: RecipeInput) {
  try {
    const { user } = await requireAdmin({ allowRedirect: false });
    const recipe = await RecipeService.createRecipe(input, user.id);
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
    return { success: true, data: recipe };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطا در به‌روزرسانی دستور' };
  }
}

export async function duplicateRecipeAction(id: string) {
  try {
    const { user } = await requireAdmin({ allowRedirect: false });
    const duplicated = await RecipeService.duplicateRecipe(id, user.id);
    return { success: true, data: duplicated };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطا در کپی دستور' };
  }
}

export async function deleteRecipeAction(id: string) {
  try {
    const { user } = await requireAdmin({ allowRedirect: false });
    const deleted = await RecipeService.deleteRecipe(id, user.id);
    return { success: true, data: deleted };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطا در حذف دستور' };
  }
}
