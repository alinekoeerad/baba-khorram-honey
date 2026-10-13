'use client';

/**
 * Contact View Component (Phase 10 Tasks 3-5)
 *
 * Requirements:
 * - Displays address, working hours, and all active contact channels.
 * - Map section with lazy-loaded tiles and fallback card.
 * - Route navigation buttons (geo:, Google Maps, Waze, Neshan, Balad).
 * - No contact form, no messaging.
 */

import React from 'react';
import { WoodBackground } from '@/components/ui/wood-background';
import { Container } from '@/components/ui/container';
import { ContactMap } from '@/components/public/contact-map';
import { ChannelIcon } from '@/components/public/channel-icon';
import type { PublicChannelItem } from '@/server/queries/settings';
import { MapPin, Clock, Phone, ExternalLink } from 'lucide-react';

export interface ContactViewProps {
  siteNameFa: string;
  address: string;
  workingHours: string;
  latitude: number;
  longitude: number;
  zoom: number;
  channels: PublicChannelItem[];
  tileUrl?: string;
}

export function ContactView({
  siteNameFa,
  address,
  workingHours,
  latitude,
  longitude,
  zoom,
  channels,
  tileUrl,
}: ContactViewProps) {
  return (
    <WoodBackground className="py-12 sm:py-20 min-h-screen text-[#3F2A1D]">
      <Container size="default" className="space-y-12 sm:space-y-16">
        {/* Page Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FAF5EB] border border-[#D9A441]/40 text-[#C58A2A] text-xs font-black shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D9A441] animate-pulse" aria-hidden="true" />
            <span>دفتر مرکزی و کارگاه عسل طبیعی</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-[#3F2A1D] leading-tight tracking-tight">
            تماس با ما
          </h1>

          {/* Honeycomb / Diamond Accent Divider */}
          <div className="flex items-center justify-center gap-2 pt-1 pb-1" aria-hidden="true">
            <span className="h-0.5 w-10 sm:w-16 bg-gradient-to-l from-[#D9A441] to-transparent" />
            <span className="w-2 h-2 rotate-45 bg-[#D9A441]" />
            <span className="h-0.5 w-10 sm:w-16 bg-gradient-to-r from-[#D9A441] to-transparent" />
          </div>

          <p className="text-sm sm:text-base text-[#5C3A21] leading-relaxed font-semibold">
            ارتباط مستقیم با دفتر مرکزی و کارگاه عسل طبیعی باباخُرم؛ پاسخگوی سؤالات، مشاوره‌های تغذیه‌ای و پیگیری سفارش‌های شما هستیم.
          </p>
        </div>

        {/* Info Cards Grid: Warm Ivory Heritage Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-right">
          {/* 1. Address Card */}
          <div className="bg-[#FAF6EE] border border-[#DFD3C3] p-6 sm:p-7 space-y-3.5 shadow-md rounded-none">
            <div className="w-11 h-11 rounded-full bg-[#FEF3C7] border border-[#D9A441] flex items-center justify-center text-[#B45309] shadow-2xs">
              <MapPin className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-[#3F2A1D]">نشانی دفتر مرکزی</h2>
            <p className="text-xs sm:text-sm text-[#5C3A21] leading-relaxed font-medium">
              {address}
            </p>
          </div>

          {/* 2. Working Hours Card */}
          <div className="bg-[#FAF6EE] border border-[#DFD3C3] p-6 sm:p-7 space-y-3.5 shadow-md rounded-none">
            <div className="w-11 h-11 rounded-full bg-[#FEF3C7] border border-[#D9A441] flex items-center justify-center text-[#B45309] shadow-2xs">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-[#3F2A1D]">ساعت کاری و پاسخگویی</h2>
            <p className="text-xs sm:text-sm text-[#5C5248] leading-relaxed font-medium">
              {workingHours}
            </p>
          </div>

          {/* 3. Direct Contact Channels */}
          <div className="bg-[#FAF6EE] border border-[#DFD3C3] p-6 sm:p-7 space-y-3.5 shadow-md rounded-none">
            <div className="w-11 h-11 rounded-full bg-[#FEF3C7] border border-[#D9A441] flex items-center justify-center text-[#B45309] shadow-2xs">
              <Phone className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-[#3F2A1D]">راه‌های ارتباطی</h2>
            <div className="space-y-2 pt-1 divide-y divide-[#DFD3C3]">
              {channels.map((ch) => (
                <a
                  key={ch.id}
                  href={ch.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between text-xs sm:text-sm text-[#3F2A1D] hover:text-[#C58A2A] transition-colors pt-2 group font-medium"
                >
                  <div className="flex items-center gap-2">
                    <ChannelIcon type={ch.type} className="w-4 h-4 text-[#C58A2A]" />
                    <span className="font-bold text-[#3F2A1D] group-hover:text-[#C58A2A]">{ch.label || ch.type}:</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-xs text-[#5C3A21] group-hover:text-[#C58A2A]" dir="ltr">
                    <span>{ch.value}</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Map & Navigation Section */}
        <div className="bg-white border border-[#FDE68A] p-6 sm:p-10 space-y-8 shadow-xl rounded-none text-right">
          <div className="space-y-1 border-b border-[#EFE9E0] pb-4">
            <h2 className="text-2xl sm:text-3xl font-black text-[#2B2017]">
              موقعیت مکانی روی نقشه
            </h2>
            <p className="text-xs sm:text-sm text-[#786455]">
              جهت مراجعه حضوری و هماهنگی قبلی یا مسیریابی دقیق با نرم‌افزارهای ناوبری
            </p>
          </div>

          <ContactMap
            latitude={latitude}
            longitude={longitude}
            zoom={zoom}
            siteNameFa={siteNameFa}
            address={address}
            workingHours={workingHours}
            tileUrl={tileUrl}
          />
        </div>
      </Container>
    </WoodBackground>
  );
}
