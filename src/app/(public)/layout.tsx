/**
 * Public Layout (Route Group (public)) (Phase 5, Task 2)
 * Loads settings, contact channels, and active categories from the database.
 */

import React from 'react';
import { db } from '@/server/db/client';
import { getPublicSiteSettings, getPublicContactChannels } from '@/server/queries/settings';
import { getPublicCategories } from '@/server/queries/categories';
import { ShellLayout } from '@/components/public/shell-layout';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getPublicSiteSettings();
  const { contactBarChannels, footerChannels } = await getPublicContactChannels();
  const productCategories = await getPublicCategories('PRODUCT');
  const recipeCategories = await getPublicCategories('RECIPE');

  let publishedProductSlugs: string[] | undefined = undefined;
  try {
    const activeProducts = await db.product.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true },
      take: 500,
    });
    if (Array.isArray(activeProducts)) {
      publishedProductSlugs = activeProducts.map((p: any) => p.slug).filter(Boolean);
    }
  } catch {
    publishedProductSlugs = undefined;
  }

  return (
    <ShellLayout
      settings={settings}
      contactBarChannels={contactBarChannels}
      footerChannels={footerChannels}
      productCategories={productCategories}
      recipeCategories={recipeCategories}
      publishedProductSlugs={publishedProductSlugs}
    >
      {children}
    </ShellLayout>
  );
}
