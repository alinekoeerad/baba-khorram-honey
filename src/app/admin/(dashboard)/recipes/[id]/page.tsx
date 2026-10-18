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

  // Clean serialization ensuring plain serializable objects (no Prisma Promises, raw Date objects, circular refs)
  const plainRecipe = JSON.parse(JSON.stringify(recipe));
  if (Array.isArray(recipe.gallery)) {
    plainRecipe.gallery = recipe.gallery.map((g: any) => {
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
  if (recipe.mainImage) {
    const m = recipe.mainImage;
    plainRecipe.mainImage = {
      id: m.id || '',
      url: (m as any).url || (m.storageKey ? `/uploads/${m.storageKey}` : ''),
      alt: m.alt || '',
      storageKey: m.storageKey || null,
      width: m.width ?? null,
      height: m.height ?? null,
      bytes: m.bytes ?? 0,
    };
  }

  const plainCategories = JSON.parse(JSON.stringify(categories));
  const plainProducts = JSON.parse(JSON.stringify(activeProducts));

  return (
    <RecipeForm
      initialData={plainRecipe}
      categories={plainCategories}
      products={plainProducts}
      isEdit={true}
    />
  );
}
