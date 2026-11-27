import React from 'react';
import { requireAdmin } from '@/server/auth/require-admin';
import { MagazineArticleForm } from '@/components/admin/magazine/magazine-article-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'افزودن مقاله علمی جدید | پنل مدیریت',
};

export default async function NewMagazineArticlePage() {
  await requireAdmin({ allowRedirect: true });

  return (
    <div className="text-right">
      <MagazineArticleForm isEdit={false} />
    </div>
  );
}
