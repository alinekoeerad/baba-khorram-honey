/**
 * Public Feedback & Tracking Page (Phase 10.3)
 * Route: /feedback
 * Server component exporting SEO metadata and rendering FeedbackClient.
 */

import React from 'react';
import type { Metadata } from 'next';
import { FeedbackClient } from '@/components/public/feedback-client';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://babakhorram.com';

export const metadata: Metadata = {
  title: 'انتقادات، پیشنهادات و پیگیری دیدگاه | عسل باباخُرم',
  description:
    'ارسال نظرات، پیشنهادات سازنده، انتقادات کیفی و پیگیری وضعیت رسیدگی به پیام‌ها با کد رهگیری اختصاصی در عسل باباخُرم',
  alternates: {
    canonical: `${siteUrl}/feedback`,
  },
  openGraph: {
    title: 'انتقادات، پیشنهادات و پیگیری دیدگاه | عسل باباخُرم',
    description:
      'ارسال مستقیم دیدگاه‌ها و پیگیری پاسخ مدیریت عسل باباخُرم با کد رهگیری اختصاصی',
    url: `${siteUrl}/feedback`,
    locale: 'fa_IR',
    siteName: 'عسل باباخُرم',
  },
};

export default function FeedbackPage() {
  return <FeedbackClient />;
}
