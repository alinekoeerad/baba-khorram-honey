import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/server/auth/require-admin';
import { db } from '@/server/db/client';
import { ProductDetailView } from '@/components/public/product-detail-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'پیش‌نمایش محصول | پنل مدیریت',
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = 'force-dynamic';

export default async function ProductPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin({ allowRedirect: true });
  const { id } = await params;

  const product = await db.product.findUnique({
    where: { id },
    include: {
      categories: { include: { category: true } },
      mainImage: true,
      benefits: { orderBy: { sortOrder: 'asc' } },
      options: { orderBy: { sortOrder: 'asc' } },
      gallery: { orderBy: { sortOrder: 'asc' }, include: { asset: true } },
    },
  });

  if (!product) {
    notFound();
  }

  return (
    <div dir="rtl">
      {/* Top Admin Preview Banner */}
      <div className="bg-[#FEF3C7] border-b border-[#FDE68A] text-xs p-3 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#332115]">حالت پیش‌نمایش مدیر (Preview):</span>
            <span className="px-2 py-0.5 font-bold bg-[#EFE9E0] text-[#332115]">
              وضعیت: {product.status}
            </span>
            <span className="text-[#5C5248]">| شناسه: {product.slug}</span>
          </div>
          <Link
            href={`/admin/products/${product.id}`}
            className="text-xs font-bold text-[#D97706] hover:underline"
          >
            بازگشت به ویرایشگر ←
          </Link>
        </div>
      </div>

      {/* Real Product Detail View Component (Phase 8 Task 6) */}
      <ProductDetailView product={product} isAdminPreview={true} />
    </div>
  );
}
