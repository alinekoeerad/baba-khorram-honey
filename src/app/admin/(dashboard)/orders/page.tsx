/**
 * Admin Orders Management Page
 * Path: /admin/orders
 * Private management screen for reviewing and processing customer honey orders.
 */

import React from 'react';
import { requireAdmin } from '@/server/auth/require-admin';
import { db } from '@/server/db/client';
import { OrdersManagerClient } from '@/components/admin/orders-manager-client';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  await requireAdmin({ allowRedirect: true });

  const orders = await db.order.findMany({
    orderBy: { createdAt: 'desc' },
  });

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

      {/* Interactive Orders Table & Manager */}
      <OrdersManagerClient initialOrders={orders} />
    </div>
  );
}
