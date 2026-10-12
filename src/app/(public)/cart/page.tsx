/**
 * Public Cart Page (Phase 9 Task 5 & Addendum A3-A4)
 * URL: /cart
 *
 * Requirements:
 * - Returns 404 when cartEnabled = false.
 * - noindex, nofollow, noarchive.
 * - Never cached (force-dynamic).
 * - Fresh item fetching, customer delivery form, channel chooser.
 */

import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicSiteSettings, getPublicContactChannels } from '@/server/queries/settings';
import { CartView } from '@/components/public/cart-view';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'سبد خرید و ثبت سفارش | عسل باباخُرم',
  description: 'ثبت و ارسال سفارش مستقیم عسل طبیعی و خالص باباخُرم بدون نیاز به پرداخت آنلاین',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function CartPage() {
  const settings = await getPublicSiteSettings();

  // If cart is disabled, return 404
  if (!settings.cartEnabled) {
    notFound();
  }

  const { orderChannels } = await getPublicContactChannels();

  return (
    <CartView
      cartNotice={settings.cartNotice}
      orderChannels={orderChannels}
    />
  );
}
