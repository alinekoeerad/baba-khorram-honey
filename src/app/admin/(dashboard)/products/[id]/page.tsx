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

  // Clean serialization ensuring plain serializable objects (no Prisma Promises, raw Date objects, circular refs)
  const plainProduct = JSON.parse(JSON.stringify(product));
  if (Array.isArray(product.gallery)) {
    plainProduct.gallery = product.gallery.map((g: any) => {
      const asset = g?.asset || g;
      const url = asset?.url || (asset?.storageKey ? `/uploads/${asset.storageKey}` : '');
      return {
        id: asset?.id || g?.assetId || g?.id || '',
        url,
        alt: asset?.alt || g?.alt || '',
        storageKey: asset?.storageKey || g?.storageKey || null,
        width: asset?.width ?? g?.width ?? null,
        height: asset?.height ?? g?.height ?? null,
        bytes: asset?.bytes ?? g?.bytes ?? 0,
      };
    });
  }
  if (product.mainImage) {
    const m = product.mainImage;
    plainProduct.mainImage = {
      id: m.id || '',
      url: m.url || (m.storageKey ? `/uploads/${m.storageKey}` : ''),
      alt: m.alt || '',
      storageKey: m.storageKey || null,
      width: m.width ?? null,
      height: m.height ?? null,
      bytes: m.bytes ?? 0,
    };
  }

  const plainCategories = JSON.parse(JSON.stringify(categories));

  return (
    <ProductForm
      initialData={plainProduct}
      categories={plainCategories}
      isEdit={true}
    />
  );
}
