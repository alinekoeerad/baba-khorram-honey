/**
 * Homepage Admin Live Preview Route (Brief Section 7)
 * Renders all sections (ACTIVE, DRAFT, DISABLED) with a visible preview banner.
 * Supports auto-scroll to #section-{id}.
 */

import React from 'react';
import { requireAdmin } from '@/server/auth/require-admin';
import { getPreviewHomepageSections } from '@/server/queries/homepage-sections';
import { getPublicProducts } from '@/server/queries/products';
import { getPublicRecipes } from '@/server/queries/recipes';
import { DynamicSectionRenderer } from '@/components/public/dynamic-section-renderer';
import { Eye, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminHomepagePreviewPage() {
  await requireAdmin({ allowRedirect: true });

  const sections = await getPreviewHomepageSections();
  const productsRes = await getPublicProducts({ take: 12 });
  const recipesRes = await getPublicRecipes({ take: 12 });

  const products = productsRes.products || [];
  const recipes = recipesRes.recipes || [];

  return (
    <div className="flex flex-col w-full min-h-screen text-right">
      {/* Sticky Top Preview Banner */}
      <div className="sticky top-0 z-50 bg-[#1C120C] text-white border-b-2 border-[#F59E0B] px-4 py-3 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#F59E0B] text-[#332115] flex items-center justify-center font-black">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <div className="font-black text-sm text-[#FBBF24]">
              حالت پیش‌نمایش مدیر (Admin Homepage Preview)
            </div>
            <div className="text-[11px] text-white/80 font-bold">
              در این حالت تمامی بخش‌ها اعم از «پیش‌نویس» و «غیرفعال» همراه با سکشن‌های فعال به ترتیب رندر شده‌اند.
            </div>
          </div>
        </div>

        <Link
          href="/admin/homepage"
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-black text-white transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به پنل مدیریت</span>
        </Link>
      </div>

      {/* Sections Rendering */}
      <div className="flex flex-col w-full divide-y-0">
        {sections.map((section) => (
          <div key={section.id} className="relative group">
            {/* Status Floating Pill for Admin Awareness */}
            {section.status !== 'ACTIVE' && (
              <div className="absolute top-4 right-4 z-30 px-3 py-1 bg-black/80 backdrop-blur-xs text-white text-xs font-black rounded-full border border-amber-500/50 shadow-lg">
                وضعیت: {section.status === 'DRAFT' ? 'پیش‌نویس (DRAFT)' : 'غیرفعال (DISABLED)'}
              </div>
            )}

            <DynamicSectionRenderer
              section={section}
              products={products}
              recipes={recipes}
            />
          </div>
        ))}

        {sections.length === 0 && (
          <div className="py-32 text-center text-stone-500 font-bold">
            هیچ سکشنی برای پیش‌نمایش وجود ندارد.
          </div>
        )}
      </div>
    </div>
  );
}
