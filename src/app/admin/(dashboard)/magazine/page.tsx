import React from 'react';
import { requireAdmin } from '@/server/auth/require-admin';
import { getAdminMagazineArticles } from '@/server/services/magazine-service';
import { MagazineManagerClient } from './magazine-manager-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'مدیریت مجله علمی | پنل مدیریت',
};

export default async function AdminMagazinePage() {
  await requireAdmin({ allowRedirect: true });

  const articles = await getAdminMagazineArticles();

  return (
    <div className="space-y-6 text-right">
      <MagazineManagerClient initialArticles={articles} />
    </div>
  );
}
