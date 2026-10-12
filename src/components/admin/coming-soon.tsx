import React from 'react';
import Link from 'next/link';
import { uiStringsFa } from '@/content/ui-strings.fa';

export function ComingSoonCard({
  title,
  phaseNumber,
  description,
}: {
  title: string;
  phaseNumber: number;
  description: string;
}) {
  return (
    <div className="max-w-2xl bg-white border border-[#EFE9E0] p-8 shadow-xs space-y-5">
      <div className="flex items-center gap-3">
        <span className="px-3 py-1 bg-[#FEF3C7] text-[#C86A00] font-bold text-xs">
          فاز {phaseNumber}
        </span>
        <h1 className="text-xl font-bold text-[#332115]">{title}</h1>
      </div>

      <p className="text-sm text-[#5C5248] leading-relaxed">
        {description}
      </p>

      <div className="p-4 bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#5C5248]">
        <strong>وضعیت پیاده‌سازی:</strong> طبق جدول زمان‌بندی پروژه (Brief Section 18 & Progress Roadmap)، ساختار این بخش در فاز {phaseNumber} با امکانات کامل مدیریت داده پیاده‌سازی خواهد شد.
      </div>

      <div className="pt-2">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#FBBF24] hover:bg-[#F59E0B] text-[#332115] font-bold text-xs transition-colors"
        >
          <span>{uiStringsFa.adminNav.backToDashboard}</span>
          <span>←</span>
        </Link>
      </div>
    </div>
  );
}
