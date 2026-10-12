import React from 'react';
import { requireAdmin } from '@/server/auth/require-admin';
import { getHomepageSectionsAdmin } from '@/server/queries/homepage-sections';
import { HomepageSectionsClient } from './homepage-sections-client';

export const dynamic = 'force-dynamic';

export default async function AdminHomepageSectionPage() {
  await requireAdmin({ allowRedirect: true });
  const sections = await getHomepageSectionsAdmin();

  return <HomepageSectionsClient initialSections={sections} />;
}
