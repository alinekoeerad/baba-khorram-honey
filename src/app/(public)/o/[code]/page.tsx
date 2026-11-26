/**
 * Temporary Order Share Page (Phase 9 Task 8 & Addendum A4/A8)
 * URL: /o/[code]
 *
 * Requirements:
 * - noindex, nofollow, noarchive
 * - Cache-Control: no-store, no-cache
 * - Referrer-Policy: no-referrer
 * - 30-minute expiry with lazy deletion
 * - Friendly expired/unknown state
 * - Encrypted payload (AES-256-GCM)
 */

import React from 'react';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { db } from '@/server/db/client';
import { getPublicSiteSettings, getPublicContactChannels } from '@/server/queries/settings';
import { checkRateLimit } from '@/lib/rate-limit';
import { decryptOrderPayload } from '@/server/auth/order-encryption';
import { OrderShareView } from '@/components/public/order-share-view';
import { WoodBackground } from '@/components/ui/wood-background';
import { Container } from '@/components/ui/container';
import { PillButton } from '@/components/ui/pill-button';
import { AlertCircle, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'لینک موقت سفارش | عسل باباخُرم',
  referrer: 'no-referrer',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

interface OrderSharePageProps {
  params: Promise<{
    code: string;
  }>;
}

export default async function OrderSharePage({ params }: OrderSharePageProps) {
  const { code } = await params;

  // 0. Per-IP Rate Limiting (30 lookups / 10 min)
  let clientIp = '127.0.0.1';
  try {
    const headerList = await headers();
    clientIp =
      headerList.get('x-forwarded-for')?.split(',')[0].trim() ||
      headerList.get('x-real-ip') ||
      '127.0.0.1';
  } catch {}

  const rateCheck = checkRateLimit(`order_share:${clientIp}`, {
    windowMs: 10 * 60 * 1000,
    maxAttempts: 30,
  });

  if (!rateCheck.success) {
    return (
      <WoodBackground className="py-20 min-h-screen">
        <Container size="narrow" className="text-center space-y-6 bg-white p-8 sm:p-10 border border-[#FDE68A] shadow-xl rounded-none">
          <Clock className="w-12 h-12 text-[#D97706] mx-auto" />
          <h1 className="text-2xl font-black text-[#2B2017]">تعداد درخواست‌ها بیش از حد مجاز است</h1>
          <p className="text-sm text-[#5C5248] leading-relaxed max-w-md mx-auto font-medium">
            لطفاً چند دقیقه دیگر مجدداً تلاش فرمایید.
          </p>
        </Container>
      </WoodBackground>
    );
  }

  // 1. Check cartEnabled & resolve support phone from DB channels
  const [settings, publicChannels] = await Promise.all([
    getPublicSiteSettings(),
    getPublicContactChannels(),
  ]);
  if (!settings.cartEnabled) {
    notFound();
  }
  const supportPhone =
    publicChannels.orderChannels.find((c) => c.type === 'PHONE')?.value ||
    publicChannels.contactBarChannels.find((c) => c.type === 'PHONE')?.value ||
    null;

  // 2. Fetch OrderShareLink
  const link = await db.orderShareLink.findUnique({
    where: { code },
  });

  // Unknown Code
  if (!link) {
    return (
      <WoodBackground className="py-20 min-h-screen">
        <Container size="narrow" className="text-center space-y-6 bg-white p-8 sm:p-10 border border-[#FDE68A] shadow-xl rounded-none">
          <AlertCircle className="w-12 h-12 text-[#EF4444] mx-auto" />
          <h1 className="text-2xl font-black text-[#2B2017]">لینک سفارش یافت نشد</h1>
          <p className="text-sm text-[#5C5248] leading-relaxed max-w-md mx-auto font-medium">
            کد سفارش وارد شده در سامانه وجود ندارد یا قبلاً پاک شده است.
          </p>
          <div className="pt-4">
            <PillButton variant="gold" size="md" href="/products">
              مشاهده محصولات
            </PillButton>
          </div>
        </Container>
      </WoodBackground>
    );
  }

  // Check Expiry (30 minutes)
  const isExpired = new Date(link.expiresAt).getTime() < Date.now();
  if (isExpired) {
    // Lazy deletion on expired access
    try {
      await db.orderShareLink.delete({ where: { id: link.id } });
    } catch {}

    return (
      <WoodBackground className="py-20 min-h-screen">
        <Container size="narrow" className="text-center space-y-6 bg-white p-8 sm:p-10 border border-[#FDE68A] shadow-xl rounded-none">
          <Clock className="w-12 h-12 text-[#D97706] mx-auto" />
          <h1 className="text-2xl font-black text-[#2B2017]">اعتبار لینک سفارش به پایان رسیده است</h1>
          <p className="text-sm text-[#5C5248] leading-relaxed max-w-md mx-auto font-medium">
            به دلایل حفظ حریم خصوصی، لینک‌های بارکد سفارش تنها به مدت ۳۰ دقیقه فعال هستند.
            لطفاً در صورت نیاز مجدداً از طریق سبد خرید سایت اقدام به ثبت سفارش فرمایید.
          </p>
          <div className="pt-4">
            <PillButton variant="gold" size="md" href="/cart">
              بازگشت به سبد خرید
            </PillButton>
          </div>
        </Container>
      </WoodBackground>
    );
  }

  // 3. Decrypt Payload
  const decrypted = decryptOrderPayload<{
    orderCode: string;
    messageText: string;
    channelType: any;
    channelValue: string;
    directUrl: string;
  }>(link.payloadEncrypted);

  if (!decrypted) {
    return (
      <WoodBackground className="py-20 min-h-screen">
        <Container size="narrow" className="text-center space-y-6 bg-white p-8 sm:p-10 border border-[#FDE68A] shadow-xl rounded-none">
          <AlertCircle className="w-12 h-12 text-[#EF4444] mx-auto" />
          <h1 className="text-2xl font-black text-[#2B2017]">خطا در رمزگشایی سفارش</h1>
          <p className="text-sm text-[#5C5248] font-medium leading-relaxed max-w-md mx-auto">
            اطلاعات این لینک قابل بازخوانی نیست یا ساختار آن آسیب دیده است.
          </p>
          <div className="pt-4">
            <PillButton variant="gold" size="md" href="/cart">
              بازگشت به سبد خرید
            </PillButton>
          </div>
        </Container>
      </WoodBackground>
    );
  }

  return (
    <OrderShareView
      orderCode={decrypted.orderCode}
      messageText={decrypted.messageText}
      channelType={link.channelType}
      channelValue={decrypted.channelValue}
      directUrl={decrypted.directUrl}
      supportPhone={supportPhone}
      expiresAt={
        link.expiresAt instanceof Date
          ? link.expiresAt.toISOString()
          : typeof link.expiresAt === 'string'
            ? link.expiresAt
            : new Date(link.expiresAt).toISOString()
      }
    />
  );
}
