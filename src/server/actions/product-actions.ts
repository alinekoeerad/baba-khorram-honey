/**
 * Product Server Actions (Phase 4, Task 2)
 * Admin-protected actions for product CRUD, order options, and availability toggle.
 */

'use server';

import { requireAdmin } from '@/server/auth/require-admin';
import { ProductService } from '@/server/services/product-service';
import { ProductInput } from '@/server/validation';

export async function createProductAction(input: ProductInput) {
  try {
    const { user } = await requireAdmin({ allowRedirect: false });
    const product = await ProductService.createProduct(input, user.id);
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
    return { success: true, data: product };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطا در به‌روزرسانی محصول' };
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
    return { success: true, data: product };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطا در تغییر وضعیت موجودی' };
  }
}

export async function duplicateProductAction(id: string) {
  try {
    const { user } = await requireAdmin({ allowRedirect: false });
    const duplicated = await ProductService.duplicateProduct(id, user.id);
    return { success: true, data: duplicated };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطا در کپی محصول' };
  }
}

export async function deleteProductAction(id: string) {
  try {
    const { user } = await requireAdmin({ allowRedirect: false });
    const deleted = await ProductService.deleteProduct(id, user.id);
    return { success: true, data: deleted };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطا در حذف محصول' };
  }
}
