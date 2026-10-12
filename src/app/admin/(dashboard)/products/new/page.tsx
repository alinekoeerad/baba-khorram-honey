import React from 'react';
import { requireAdmin } from '@/server/auth/require-admin';
import { CategoryService } from '@/server/services/category-service';
import { ProductForm } from '@/components/admin/product-form';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  await requireAdmin({ allowRedirect: true });

  const categories = await CategoryService.listCategories('PRODUCT');
  const activeCategories = categories.filter((c: any) => c.status === 'ACTIVE');

  return (
    <ProductForm
      categories={activeCategories}
      isEdit={false}
    />
  );
}
