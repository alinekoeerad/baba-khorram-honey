/**
 * Admin Orders Management Page
 * Path: /admin/orders
 * Private management screen for reviewing and processing customer honey orders.
 */

import React from 'react';
import { requireAdmin } from '@/server/auth/require-admin';
import { db } from '@/server/db/client';
import { OrdersManagerClient } from '@/components/admin/orders-manager-client';
import { toPersianDigits } from '@/lib/domain-utils';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  await requireAdmin({ allowRedirect: true });

  const orders = await db.order.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const totalCount = orders.length;
  const newCount = orders.filter((o: any) => o.status === 'NEW').length;
  const contactedCount = orders.filter((o: any) => o.status === 'CONTACTED').length;
  const shippedCount = orders.filter((o: any) => o.status === 'SHIPPED').length;
  const cancelledCount = orders.filter((o: any) => o.status === 'CANCELLED').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#EFE9E0] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#332115] tracking-tight">
            مدیریت سفارشات عسل باباخُرم
          </h1>
          <p className="text-sm text-[#5C5248] mt-1.5 font-medium">
            بررسی، هماهنگی ارسال، پیگیری فاکتورها و تغییر وضعیت سفارش‌های ثبت‌شده مشتریان
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#EFE9E0] p-5 shadow-xs">
          <div className="text-xs font-bold text-[#5C5248]">کل سفارش‌ها</div>
          <div className="text-2xl sm:text-3xl font-black text-[#332115] mt-2 font-mono">
            {toPersianDigits(totalCount)}
          </div>
        </div>

        <div className="bg-white border border-[#EFE9E0] p-5 shadow-xs">
          <div className="text-xs font-bold text-rose-700">جدید (در انتظار هماهنگی)</div>
          <div className="text-2xl sm:text-3xl font-black text-rose-700 mt-2 font-mono">
            {toPersianDigits(newCount)}
          </div>
        </div>

        <div className="bg-white border border-[#EFE9E0] p-5 shadow-xs">
          <div className="text-xs font-bold text-[#D97706]">هماهنگ شده</div>
          <div className="text-2xl sm:text-3xl font-black text-[#D97706] mt-2 font-mono">
            {toPersianDigits(contactedCount)}
          </div>
        </div>

        <div className="bg-white border border-[#EFE9E0] p-5 shadow-xs">
          <div className="text-xs font-bold text-[#3F8F3B]">ارسال شده</div>
          <div className="text-2xl sm:text-3xl font-black text-[#3F8F3B] mt-2 font-mono">
            {toPersianDigits(shippedCount)}
          </div>
        </div>
      </div>

      {/* Interactive Orders Table & Manager */}
      <OrdersManagerClient initialOrders={orders} />
    </div>
  );
}
