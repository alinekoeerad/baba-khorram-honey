/**
 * Public Layout (Route Group (public)) (Phase 5, Task 2)
 * Loads settings, contact channels, and active categories from the database.
 */

import React from 'react';
import { getPublicSiteSettings, getPublicContactChannels } from '@/server/queries/settings';
import { getPublicCategories } from '@/server/queries/categories';
import { ShellLayout } from '@/components/public/shell-layout';

export const revalidate = 3600; // 1 hour default ISR, actively revalidated on admin mutation

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getPublicSiteSettings();
  const { contactBarChannels, footerChannels } = await getPublicContactChannels();
  const productCategories = await getPublicCategories('PRODUCT');
  const recipeCategories = await getPublicCategories('RECIPE');

  return (
    <ShellLayout
      settings={settings}
      contactBarChannels={contactBarChannels}
      footerChannels={footerChannels}
      productCategories={productCategories}
      recipeCategories={recipeCategories}
    >
      {children}
    </ShellLayout>
  );
}
