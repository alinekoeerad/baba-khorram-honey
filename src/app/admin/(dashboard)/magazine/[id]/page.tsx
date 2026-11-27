import React from 'react';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/server/auth/require-admin';
import { getMagazineArticleById } from '@/server/services/magazine-service';
import { MagazineArticleForm } from '@/components/admin/magazine/magazine-article-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'ویرایش مقاله علمی | پنل مدیریت',
};

export default async function EditMagazineArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin({ allowRedirect: true });
  const { id } = await params;

  const article = await getMagazineArticleById(id);

  if (!article) {
    notFound();
  }

  // Ensure plain serializable object
  const plainArticle = JSON.parse(JSON.stringify(article));

  return (
    <div className="text-right">
      <MagazineArticleForm initialData={plainArticle} isEdit={true} />
    </div>
  );
}
