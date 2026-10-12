import React from 'react';
import { requireAdmin } from '@/server/auth/require-admin';
import { NewSectionClient } from './new-section-client';

export const dynamic = 'force-dynamic';

export default async function NewHomepageSectionPage() {
  await requireAdmin({ allowRedirect: true });

  return <NewSectionClient />;
}
