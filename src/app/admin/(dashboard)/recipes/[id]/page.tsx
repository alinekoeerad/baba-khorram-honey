import React from 'react';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/server/auth/require-admin';
import { RecipeService } from '@/server/services/recipe-service';
import { CategoryService } from '@/server/services/category-service';
import { ProductService } from '@/server/services/product-service';
import { RecipeForm } from '@/components/admin/recipe-form';

export const dynamic = 'force-dynamic';

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin({ allowRedirect: true });
  const { id } = await params;

  const [recipe, categories, productData] = await Promise.all([
    RecipeService.getRecipeById(id),
    CategoryService.listCategories('RECIPE'),
    ProductService.listProducts(),
  ]);

  if (!recipe) {
    notFound();
  }

  const activeProducts = ((productData as any).items || []).filter((p: any) => p.status === 'PUBLISHED' || !p.status);

  return (
    <RecipeForm
      initialData={recipe}
      categories={categories}
      products={activeProducts}
      isEdit={true}
    />
  );
}
