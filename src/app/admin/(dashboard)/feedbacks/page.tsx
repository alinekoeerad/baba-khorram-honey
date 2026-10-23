/**
 * Admin Feedbacks Management Page (Phase 10.3)
 * Path: /admin/feedbacks
 * Private management screen for reviewing and processing customer feedback and suggestions.
 */

import React from 'react';
import { requireAdmin } from '@/server/auth/require-admin';
import { db } from '@/server/db/client';
import { FeedbacksManagerClient } from './feedbacks-manager-client';
import { toPersianDigits } from '@/lib/domain-utils';

export const dynamic = 'force-dynamic';

export default async function AdminFeedbacksPage() {
  await requireAdmin({ allowRedirect: true });

  const feedbacks = await db.feedback.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const formattedFeedbacks = feedbacks.map((f: any) => ({
    ...f,
    createdAt:
      f.createdAt instanceof Date
        ? f.createdAt.toISOString()
        : typeof f.createdAt === 'string'
          ? f.createdAt
          : new Date(f.createdAt || Date.now()).toISOString(),
  }));

  const totalCount = feedbacks.length;
  const unreadCount = feedbacks.filter((f: any) => f.status === 'UNREAD').length;
  const reviewedCount = feedbacks.filter((f: any) => f.status === 'REVIEWED').length;
  const suggestionCount = feedbacks.filter((f: any) => f.type === 'SUGGESTION').length;
  const criticismCount = feedbacks.filter((f: any) => f.type === 'CRITICISM').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#EFE9E0] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#332115] tracking-tight">
            انتقادات و پیشنهادات کاربران
          </h1>
          <p className="text-sm text-[#5C5248] mt-1.5 font-medium">
            بررسی، پاسخ‌گویی و مدیریت بازخوردهای محرمانه ثبت‌شده توسط مشتریان
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#EFE9E0] p-5 shadow-xs">
          <div className="text-xs font-bold text-[#5C5248]">کل بازخوردها</div>
          <div className="text-2xl sm:text-3xl font-black text-[#332115] mt-2 font-mono">
            {toPersianDigits(totalCount)}
          </div>
        </div>

        <div className="bg-white border border-[#EFE9E0] p-5 shadow-xs">
          <div className="text-xs font-bold text-rose-700">خوانده‌نشده (جدید)</div>
          <div className="text-2xl sm:text-3xl font-black text-rose-700 mt-2 font-mono">
            {toPersianDigits(unreadCount)}
          </div>
        </div>

        <div className="bg-white border border-[#EFE9E0] p-5 shadow-xs">
          <div className="text-xs font-bold text-[#D97706]">پیشنهادات سازنده</div>
          <div className="text-2xl sm:text-3xl font-black text-[#D97706] mt-2 font-mono">
            {toPersianDigits(suggestionCount)}
          </div>
        </div>

        <div className="bg-white border border-[#EFE9E0] p-5 shadow-xs">
          <div className="text-xs font-bold text-[#9E3556]">انتقادات و شکایات</div>
          <div className="text-2xl sm:text-3xl font-black text-[#9E3556] mt-2 font-mono">
            {toPersianDigits(criticismCount)}
          </div>
        </div>
      </div>

      {/* Interactive Feedbacks Table & Manager */}
      <FeedbacksManagerClient initialFeedbacks={formattedFeedbacks} />
    </div>
  );
}
