'use client';

/**
 * Order Share View Component (Phase 9 Task 8 & Addendum A4)
 * Client component for /o/[code] page.
 */

import React, { useState } from 'react';
import { WoodBackground } from '@/components/ui/wood-background';
import { Container } from '@/components/ui/container';
import { PillButton } from '@/components/ui/pill-button';
import { Copy, Check, ExternalLink, Clock, AlertCircle } from 'lucide-react';
import type { ChannelType } from '@prisma/client';

export interface OrderShareViewProps {
  orderCode: string;
  messageText: string;
  channelType: ChannelType;
  channelValue: string;
  directUrl: string;
  expiresAt: string; // ISO string
}

const CHANNEL_NAMES: Record<ChannelType, string> = {
  PHONE: 'پیامک (SMS)',
  WHATSAPP: 'واتساپ',
  TELEGRAM: 'تلگرام',
  EITAA: 'ایتا',
  BALE: 'بله',
  RUBIKA: 'روبیکا',
  INSTAGRAM: 'اینستاگرام',
};

export function OrderShareView({
  orderCode,
  messageText,
  channelType,
  channelValue,
  directUrl,
  expiresAt,
}: OrderShareViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = messageText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const channelName = CHANNEL_NAMES[channelType] || 'پیام‌رسان';

  return (
    <WoodBackground className="py-12 sm:py-20 min-h-screen">
      <Container size="narrow" className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-block px-3 py-1 bg-[#FBBF24]/20 border border-[#FBBF24]/40 text-[#FBBF24] text-xs font-bold rounded-full">
            ارسال سفارش تلفن همراه
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white">
            سفارش عسل باباخُرم
          </h1>
          <p className="text-xs sm:text-sm text-[#E8E2D9]">
            کد پیگیری سفارش:{' '}
            <span className="font-mono font-bold text-[#FBBF24]">{orderCode}</span>
          </p>
        </div>

        {/* Expiry Warning Notice */}
        <div className="flex items-center gap-2 p-3 bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] text-xs justify-center shadow-xs rounded-none font-bold">
          <Clock className="w-4 h-4 text-[#D97706] shrink-0" />
          <span>اعتبار این صفحه موقت بوده و تا ۳۰ دقیقه پس از صدور منقضی خواهد شد.</span>
        </div>

        {/* Order Message Box: Warm Ivory Artisan Sheet */}
        <div className="bg-white border border-[#FDE68A] p-5 sm:p-6 space-y-4 shadow-xl rounded-none text-right">
          <div className="flex items-center justify-between text-xs text-[#2B2017] border-b border-[#EFE9E0] pb-2.5">
            <span className="font-black text-sm">متن آماده سفارش ({channelName}):</span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-[#D97706] hover:text-[#B45309] font-black transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>کپی شد!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>کپی متن</span>
                </>
              )}
            </button>
          </div>

          <pre
            className="w-full max-h-80 overflow-y-auto whitespace-pre-wrap font-sans text-xs sm:text-sm text-[#2B2017] leading-relaxed bg-[#FAF7F2] p-4 border border-[#EFE9E0] select-all rounded-none font-medium"
            dir="rtl"
          >
            {messageText}
          </pre>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          {directUrl && directUrl !== '#' && (
            <a
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#15803D] hover:bg-[#166534] text-white font-black text-sm sm:text-base shadow-lg transition-all"
            >
              <ExternalLink className="w-5 h-5" />
              <span>ارسال در {channelName}</span>
            </a>
          )}

          <PillButton
            variant="gold"
            size="lg"
            onClick={handleCopy}
            className="w-full sm:w-auto justify-center font-black"
          >
            {copied ? 'متن کپی شد' : 'کپی مجدد متن سفارش'}
          </PillButton>
        </div>
      </Container>
    </WoodBackground>
  );
}
