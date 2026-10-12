import React from 'react';
import { requireAdmin } from '@/server/auth/require-admin';
import { CategoryService } from '@/server/services/category-service';
import { RecipeForm } from '@/components/admin/recipe-form';

export const dynamic = 'force-dynamic';

export default async function NewRecipePage() {
  await requireAdmin({ allowRedirect: true });

  const categories = await CategoryService.listCategories('RECIPE');
  const activeCategories = categories.filter((c: any) => c.status === 'ACTIVE');

  return (
    <RecipeForm
      categories={activeCategories}
      isEdit={false}
    />
  );
}
