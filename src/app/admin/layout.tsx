import type { Metadata } from 'next';
import React from 'react';

/**
 * Root Admin Layout (Phase 2, Task 9)
 * Enforces:
 * - robots: noindex, nofollow, nocache
 * - dynamic = 'force-dynamic' (never cached publicly)
 * - revalidate = 0
 * - dir="rtl" and Vazirmatn typography
 */
export const metadata: Metadata = {
  title: 'پنل مدیریت | عسل باباخُرم',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FDFBF8] text-[#2B2017] font-sans antialiased" dir="rtl">
      {children}
    </div>
  );
}
