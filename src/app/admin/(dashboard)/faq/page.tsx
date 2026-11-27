import React from 'react';
import { requireAdmin } from '@/server/auth/require-admin';
import { getAdminFaqItems } from '@/server/services/faq-service';
import { FaqManagerClient } from './faq-manager-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'مدیریت سوالات متداول | پنل مدیریت',
};

export default async function AdminFaqPage() {
  await requireAdmin({ allowRedirect: true });

  const faqs = await getAdminFaqItems();

  return (
    <div className="space-y-6 text-right">
      <FaqManagerClient initialFaqs={faqs} />
    </div>
  );
}
