'use client';

/**
 * Order Share View Component (Phase 9 Task 8 & Addendum A4)
 * Client component for /o/[code] page.
 */

import React, { useState } from 'react';
import { WoodBackground } from '@/components/ui/wood-background';
import { Container } from '@/components/ui/container';
import { PillButton } from '@/components/ui/pill-button';
import { Copy, Check, ExternalLink, Clock, Share2 } from 'lucide-react';
import { copyTextSync, copyTextToClipboard, isIosDevice, buildSmsUri } from '@/lib/clipboard';
import { buildChannelOrderUrl } from '@/lib/contact-channels';
import { SmartHandoffPanel } from './smart-handoff-panel';
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
  YOUTUBE: 'یوتیوب',
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
  const [canShare, setCanShare] = useState(false);

  React.useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setCanShare(true);
    }
  }, []);

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `سفارش ${orderCode}`,
          text: messageText,
        });
      } catch {}
    }
  };

  const isIranianMessenger =
    channelType === 'EITAA' ||
    channelType === 'BALE' ||
    channelType === 'RUBIKA';

  const handleCopy = async () => {
    copyTextSync(messageText);
    const success = await copyTextToClipboard(messageText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  // Compute platform-aware direct URL with pre-filled text parameter
  const getComputedDirectUrl = () => {
    return buildChannelOrderUrl(channelType, channelValue, messageText, {
      isIos: isIosDevice(),
    });
  };

  const computedUrl = getComputedDirectUrl();
  const channelName = CHANNEL_NAMES[channelType] || 'پیام‌رسان';

  const handleOpenChannel = (e?: React.MouseEvent) => {
    // 1. Dual-Safety: Synchronously copy messageText to clipboard first
    copyTextSync(messageText);
    copyTextToClipboard(messageText);
    setCopied(true);

    // 2. Dual-Safety: Synchronous navigation immediately without awaiting
    if (computedUrl && computedUrl !== '#') {
      window.location.href = computedUrl;
    }
  };

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

        {/* Action Buttons: Smart Handoff for Eitaa/Bale/Rubika vs Direct Prefill for WhatsApp/Telegram/SMS */}
        {isIranianMessenger ? (
          <div className="space-y-4">
            <SmartHandoffPanel
              orderCode={orderCode}
              messageText={messageText}
              channelType={channelType}
              channelValue={channelValue}
              channelLabel={channelName}
              directUrl={computedUrl}
            />

            {canShare && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleShare}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#D97706] hover:bg-[#B45309] text-white font-black text-sm sm:text-base shadow-lg transition-all cursor-pointer"
                >
                  <Share2 className="w-5 h-5" />
                  <span>ارسال مستقیم به تمام پیام‌رسان‌ها (اشتراک‌گذاری)</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            {canShare && (
              <button
                type="button"
                onClick={handleShare}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#D97706] hover:bg-[#B45309] text-white font-black text-sm sm:text-base shadow-lg transition-all cursor-pointer"
              >
                <Share2 className="w-5 h-5" />
                <span>ارسال مستقیم به تمام پیام‌رسان‌ها (اشتراک‌گذاری)</span>
              </button>
            )}

            {computedUrl && computedUrl !== '#' && (
              <a
                href={computedUrl}
                onClick={() => {
                  copyTextSync(messageText);
                  copyTextToClipboard(messageText);
                  setCopied(true);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#15803D] hover:bg-[#166534] text-white font-black text-sm sm:text-base shadow-lg transition-all cursor-pointer"
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
        )}
      </Container>
    </WoodBackground>
  );
}
