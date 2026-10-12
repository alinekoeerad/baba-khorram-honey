import React from 'react';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/server/auth/require-admin';
import { getHomepageSectionById } from '@/server/queries/homepage-sections';
import { SectionForm } from '@/components/admin/homepage/section-form';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface EditSectionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditHomepageSectionPage({ params }: EditSectionPageProps) {
  await requireAdmin({ allowRedirect: true });
  const { id } = await params;
  const section = await getHomepageSectionById(id);

  if (!section) {
    notFound();
  }

  return (
    <div className="space-y-6 text-right">
      <div className="flex items-center justify-between pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl font-black text-[#2B2017] tracking-tight">
            ویرایش سکشن «{section.internalName}»
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 font-bold mt-1">
            نوع: <span className="font-mono">{section.type}</span> | قالب: <span className="font-mono">{section.template}</span>
          </p>
        </div>

        <Link
          href="/admin/homepage"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به لیست سکشن‌ها</span>
        </Link>
      </div>

      <SectionForm
        isNew={false}
        initialData={{
          id: section.id,
          internalName: section.internalName,
          type: section.type as any,
          template: section.template,
          status: section.status as any,
          background: section.background as any,
          sortOrder: section.sortOrder,
          content: section.content,
        }}
      />
    </div>
  );
}
