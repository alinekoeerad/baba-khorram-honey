import React from 'react';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/server/auth/require-admin';
import { RecipeService } from '@/server/services/recipe-service';
import { CategoryService } from '@/server/services/category-service';
import { RecipeForm } from '@/components/admin/recipe-form';

export const dynamic = 'force-dynamic';

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin({ allowRedirect: true });
  const { id } = await params;

  const [recipe, categories] = await Promise.all([
    RecipeService.getRecipeById(id),
    CategoryService.listCategories('RECIPE'),
  ]);

  if (!recipe) {
    notFound();
  }

  return (
    <RecipeForm
      initialData={recipe}
      categories={categories}
      isEdit={true}
    />
  );
}
