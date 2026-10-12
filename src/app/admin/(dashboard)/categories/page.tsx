import React from 'react';
import { requireAdmin } from '@/server/auth/require-admin';
import { CategoryService } from '@/server/services/category-service';
import { CategoriesManager } from './categories-manager';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  await requireAdmin({ allowRedirect: true });

  const categories = await CategoryService.listCategories();

  return <CategoriesManager initialCategories={categories} />;
}
