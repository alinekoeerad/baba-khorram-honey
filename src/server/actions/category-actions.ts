/**
 * Category Server Actions (Phase 4, Task 1)
 * Admin-protected actions for category lifecycle.
 */

'use server';

import { requireAdmin } from '@/server/auth/require-admin';
import { CategoryService } from '@/server/services/category-service';
import { CategoryInput } from '@/server/validation';

export async function createCategoryAction(input: CategoryInput) {
  try {
    const { user } = await requireAdmin({ allowRedirect: false });
    const category = await CategoryService.createCategory(input, user.id);
    return { success: true, data: category };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطا در ایجاد دسته‌بندی' };
  }
}

export async function updateCategoryAction(params: { id: string; input: Partial<CategoryInput> }) {
  try {
    const { user } = await requireAdmin({ allowRedirect: false });
    const category = await CategoryService.updateCategory(params.id, params.input, user.id);
    return { success: true, data: category };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطا در ویرایش دسته‌بندی' };
  }
}

export async function toggleCategoryStatusAction(params: { id: string; status: 'ACTIVE' | 'ARCHIVED' }) {
  try {
    const { user } = await requireAdmin({ allowRedirect: false });
    const category = await CategoryService.toggleCategoryStatus(params.id, params.status, user.id);
    return { success: true, data: category };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطا در تغییر وضعیت دسته‌بندی' };
  }
}

export async function deleteCategoryAction(id: string) {
  try {
    const { user } = await requireAdmin({ allowRedirect: false });
    const category = await CategoryService.deleteCategory(id, user.id);
    return { success: true, data: category };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطا در حذف دسته‌بندی' };
  }
}
