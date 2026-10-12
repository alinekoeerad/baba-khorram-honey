import React from 'react';
import { requireAdmin } from '@/server/auth/require-admin';
import { RecipeService } from '@/server/services/recipe-service';
import { CategoryService } from '@/server/services/category-service';
import { RecipesList } from './recipes-list';

export const dynamic = 'force-dynamic';

export default async function AdminRecipesPage() {
  await requireAdmin({ allowRedirect: true });

  const [recipesData, categories] = await Promise.all([
    RecipeService.listRecipes(),
    CategoryService.listCategories('RECIPE'),
  ]);

  return (
    <RecipesList
      initialRecipes={recipesData.items}
      categories={categories}
      totalCount={recipesData.totalCount}
    />
  );
}
