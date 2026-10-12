import React from 'react';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/server/auth/require-admin';
import { ProductService } from '@/server/services/product-service';
import { CategoryService } from '@/server/services/category-service';
import { ProductForm } from '@/components/admin/product-form';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin({ allowRedirect: true });
  const { id } = await params;

  const [product, categories] = await Promise.all([
    ProductService.getProductById(id),
    CategoryService.listCategories('PRODUCT'),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <ProductForm
      initialData={product}
      categories={categories}
      isEdit={true}
    />
  );
}
