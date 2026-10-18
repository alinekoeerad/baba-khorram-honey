/**
 * Product Server Actions (Phase 4, Task 2)
 * Admin-protected actions for product CRUD, order options, and availability toggle.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/server/auth/require-admin';
import { ProductService } from '@/server/services/product-service';
import { ProductInput } from '@/server/validation';

function revalidateProductPaths(slug?: string) {
  try {
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

export async function createProductAction(input: ProductInput) {
  try {
    const { user } = await requireAdmin({ allowRedirect: false });
    const product = await ProductService.createProduct(input, user.id);
    revalidateProductPaths(product?.slug);
    return { success: true, data: product };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطا در ایجاد محصول' };
  }
}

export async function updateProductAction(params: {
  id: string;
  input: Partial<ProductInput>;
  expectedUpdatedAt?: string | Date;
}) {
  try {
    const { user } = await requireAdmin({ allowRedirect: false });
    const product = await ProductService.updateProduct(
      params.id,
      params.input,
      params.expectedUpdatedAt,
      user.id
    );
    revalidateProductPaths(product?.slug);
    return { success: true, data: product };
  } catch (err: any) {
    const isConflict = err.name === 'ConcurrencyConflictError' || err?.message?.includes('دیگری ویرایش شده است');
    return { success: false, error: err.message || 'خطا در به‌روزرسانی محصول', isConflict };
  }
}

export async function toggleProductAvailabilityAction(params: {
  id: string;
  isAvailable: boolean;
}) {
  try {
    const { user } = await requireAdmin({ allowRedirect: false });
    const product = await ProductService.toggleProductAvailability(
      params.id,
      params.isAvailable,
      user.id
    );
    revalidateProductPaths(product?.slug);
    return { success: true, data: product };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطا در تغییر وضعیت موجودی' };
  }
}

export async function duplicateProductAction(id: string) {
  try {
    const { user } = await requireAdmin({ allowRedirect: false });
    const duplicated = await ProductService.duplicateProduct(id, user.id);
    revalidateProductPaths(duplicated?.slug);
    return { success: true, data: duplicated };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطا در کپی محصول' };
  }
}

export async function bulkDeleteProductsAction(ids: string[]) {
  try {
    const { user } = await requireAdmin({ allowRedirect: false });
    const res = await ProductService.bulkDeleteProducts(ids, user.id);
    revalidateProductPaths();
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطا در حذف دسته‌ای محصولات' };
  }
}

export async function bulkToggleProductAvailabilityAction(params: {
  ids: string[];
  isAvailable: boolean;
}) {
  try {
    const { user } = await requireAdmin({ allowRedirect: false });
    const res = await ProductService.bulkToggleProductAvailability(
      params.ids,
      params.isAvailable,
      user.id
    );
    revalidateProductPaths();
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطا در به‌روزرسانی دسته‌ای موجودی' };
  }
}

export async function deleteProductAction(id: string) {
  try {
    const { user } = await requireAdmin({ allowRedirect: false });
    const deleted = await ProductService.deleteProduct(id, user.id);
    revalidateProductPaths(deleted?.slug);
    return { success: true, data: deleted };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطا در حذف محصول' };
  }
}
