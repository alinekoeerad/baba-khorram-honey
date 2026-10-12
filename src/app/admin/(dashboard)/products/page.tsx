import React from 'react';
import { requireAdmin } from '@/server/auth/require-admin';
import { ProductService } from '@/server/services/product-service';
import { CategoryService } from '@/server/services/category-service';
import { ProductsList } from './products-list';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  await requireAdmin({ allowRedirect: true });

  const [productsData, categories] = await Promise.all([
    ProductService.listProducts(),
    CategoryService.listCategories('PRODUCT'),
  ]);

  return (
    <ProductsList
      initialProducts={productsData.items}
      categories={categories}
      totalCount={productsData.totalCount}
    />
  );
}
