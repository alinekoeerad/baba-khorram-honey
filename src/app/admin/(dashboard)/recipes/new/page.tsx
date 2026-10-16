import React from 'react';
import { requireAdmin } from '@/server/auth/require-admin';
import { CategoryService } from '@/server/services/category-service';
import { ProductService } from '@/server/services/product-service';
import { RecipeForm } from '@/components/admin/recipe-form';

export const dynamic = 'force-dynamic';

export default async function NewRecipePage() {
  await requireAdmin({ allowRedirect: true });

  const [categories, productData] = await Promise.all([
    CategoryService.listCategories('RECIPE'),
    ProductService.listProducts(),
  ]);
  const activeCategories = categories.filter((c: any) => c.status === 'ACTIVE');
  const activeProducts = ((productData as any).items || []).filter((p: any) => p.status === 'PUBLISHED' || !p.status);

  return (
    <RecipeForm
      categories={activeCategories}
      products={activeProducts}
      isEdit={false}
    />
  );
}
