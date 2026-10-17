'use client';

/**
 * Smart Handoff Panel for Iranian Messengers (Eitaa, Bale, Rubika)
 * and Direct Prefill Channels (WhatsApp, Telegram, SMS)
 *
 * Solves the Iranian messenger limitation where direct user profile links
 * (?text=) do not pre-fill the chat input box.
 *
 * Guarantees:
 * 1. Synchronous clipboard copy preserves active user-gesture context.
 * 2. Primary Button 1: Opens direct PV chat to Paste the order.
 * 3. Secondary Button 2: Direct Share URL (ble.ir/share & eitaa.com/share/url)
 *    which natively carries the order text directly into the app.
 * 4. WhatsApp, Telegram, and SMS maintain direct prefilled link opening.
 */

import React, { useState } from 'react';
import { copyTextSync, copyTextToClipboard, getClientOrigin } from '@/lib/clipboard';
import { Check, Copy, ExternalLink, Share2, MessageCircle } from 'lucide-react';
import type { ChannelType } from '@prisma/client';

export interface SmartHandoffPanelProps {
  orderCode: string;
  messageText: string;
  channelType?: ChannelType | string;
  channelValue: string;
  channelLabel?: string;
  directUrl?: string;
  siteUrl?: string;
  className?: string;
}

export function SmartHandoffPanel({
  orderCode,
  messageText,
  channelType = 'EITAA',
  channelValue,
  channelLabel,
  directUrl,
  siteUrl,
  className = '',
}: SmartHandoffPanelProps) {
  const [copied, setCopied] = useState(true); // Default true since order build copies text immediately
  const [effectiveSiteUrl, setEffectiveSiteUrl] = useState<string>(() => {
    return siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://babakhorram.com';
  });

  React.useEffect(() => {
    if (!siteUrl && typeof window !== 'undefined' && window.location?.origin) {
      setEffectiveSiteUrl(window.location.origin);
    }
  }, [siteUrl]);

  const cleanValue = (channelValue || '').replace(/^@/, '').trim();


  const isIranianMessenger =
    channelType === 'EITAA' ||
    channelType === 'BALE' ||
    channelType === 'RUBIKA';

  const defaultLabel =
    channelType === 'EITAA'
      ? 'ایتا'
      : channelType === 'BALE'
      ? 'بله'
      : channelType === 'RUBIKA'
      ? 'روبیکا'
      : channelType === 'WHATSAPP'
      ? 'واتساپ'
      : channelType === 'TELEGRAM'
      ? 'تلگرام'
      : channelType === 'PHONE'
      ? 'پیامک'
      : 'پیام‌رسان';

  const displayChannelName = channelLabel || defaultLabel;

  // Direct PV profile chat links
  let pvLink = '#';
  if (channelType === 'EITAA') {
    pvLink = `https://eitaa.com/${cleanValue}`;
  } else if (channelType === 'BALE') {
    pvLink = `https://ble.ir/${cleanValue}`;
  } else if (channelType === 'RUBIKA') {
    pvLink = `https://rubika.ir/${cleanValue}`;
  } else if (directUrl) {
    pvLink = directUrl;
  }

  // Native app share endpoints that pre-attach text
  let shareEndpointUrl: string | null = null;
  if (channelType === 'BALE') {
    shareEndpointUrl = `https://ble.ir/share?url=${encodeURIComponent(
      effectiveSiteUrl
    )}&text=${encodeURIComponent(messageText)}`;
  } else if (channelType === 'EITAA') {
    shareEndpointUrl = `https://eitaa.com/share/url?url=${encodeURIComponent(
      effectiveSiteUrl
    )}&text=${encodeURIComponent(messageText)}`;
  }

  // Synchronous clipboard copy wrapper ensuring user gesture preservation
  const performCopy = () => {
    copyTextSync(messageText);
    copyTextToClipboard(messageText);
    setCopied(true);
  };

  const handleOpenPv = (e: React.MouseEvent<HTMLAnchorElement>) => {
    performCopy();
  };

  const handleOpenShare = (e: React.MouseEvent<HTMLAnchorElement>) => {
    performCopy();
  };

  const handleManualCopy = async () => {
    performCopy();
    setTimeout(() => setCopied(false), 3500);
  };

  if (!isIranianMessenger) {
    // For WhatsApp, Telegram, and SMS: pre-filling is natively supported
    return (
      <div className={`space-y-4 ${className}`}>
        {directUrl && directUrl !== '#' && (
          <a
            href={directUrl}
            onClick={performCopy}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#15803D] hover:bg-[#166534] text-white font-black text-sm sm:text-base shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            <ExternalLink className="w-5 h-5 shrink-0" />
            <span>ارسال مستقیم در {displayChannelName}</span>
          </a>
        )}
        <button
          type="button"
          onClick={handleManualCopy}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#FAF7F2] hover:bg-[#FFFBEB] text-[#78350F] border border-[#FDE68A] font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span>متن سفارش کپی شد</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>کپی مجدد متن سفارش</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div
      className={`p-4 sm:p-5 bg-[#FDFCF9] border-2 border-[#FDE68A] rounded-none space-y-4 text-right shadow-sm ${className}`}
    >
      {/* Prominent Green Badge */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-400 text-emerald-900 text-xs sm:text-sm font-black rounded-full shadow-xs">
          <span>✅ متن کامل سفارش کپی شد! (کد سفارش: {orderCode})</span>
        </div>

        <button
          type="button"
          onClick={handleManualCopy}
          className="inline-flex items-center gap-1.5 text-xs text-[#D97706] hover:text-[#B45309] font-black cursor-pointer transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>کپی شد</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>کپی مجدد</span>
            </>
          )}
        </button>
      </div>

      {/* Clear Instruction */}
      <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] text-xs sm:text-sm font-medium leading-relaxed rounded-none">
        <p className="font-bold text-[#78350F] mb-1">راهنمای ارسال سریع:</p>
        <p>
          در پیام‌رسان ایتا و بله، کافی است پس از ورود به صفحه گفتگو، در کادر پیام نگهدارید و گزینه «جایگذاری / Paste» را بزنید:
        </p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5 pt-1">
        {/* Primary Button 1: Direct PV Chat */}
        <a
          href={pvLink}
          onClick={handleOpenPv}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-[#15803D] hover:bg-[#166534] text-white font-black text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer"
        >
          <MessageCircle className="w-4 h-4 shrink-0" />
          <span>
            ۱. باز کردن پیوی {displayChannelName} ({cleanValue ? `@${cleanValue}` : ''}) و Paste کردن سفارش
          </span>
        </a>

        {/* Secondary Button 2: Direct Text Forward / Share into App */}
        {shareEndpointUrl && (
          <a
            href={shareEndpointUrl}
            onClick={handleOpenShare}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#D97706] hover:bg-[#B45309] text-white font-black text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            <Share2 className="w-4 h-4 shrink-0" />
            <span>
              ارسال مستقیم متن به داخل برنامه {displayChannelName} (حالت اشتراک‌گذاری)
            </span>
          </a>
        )}
      </div>
    </div>
  );
}
