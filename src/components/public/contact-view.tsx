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
    <WoodBackground className="py-12 sm:py-20 min-h-screen">
      <Container size="default" className="space-y-12 sm:space-y-16">
        {/* Page Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
            تماس با ما
          </h1>
          <p className="text-sm sm:text-base text-[#E8E2D9] leading-relaxed">
            ارتباط مستقیم با دفتر مرکزی و کارگاه عسل طبیعی باباخُرم؛ پاسخگوی سؤالات، مشاوره‌های تغذیه‌ای و پیگیری سفارش‌های شما هستیم.
          </p>
        </div>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Address Card */}
          <div className="bg-black/35 border-2 border-white/20 p-6 space-y-3 shadow-xl">
            <div className="w-10 h-10 rounded-full bg-[#FBBF24]/20 flex items-center justify-center text-[#FBBF24]">
              <MapPin className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-white">نشانی دفتر مرکزی</h2>
            <p className="text-xs sm:text-sm text-[#E8E2D9] leading-relaxed">
              {address}
            </p>
          </div>

          {/* 2. Working Hours Card */}
          <div className="bg-black/35 border-2 border-white/20 p-6 space-y-3 shadow-xl">
            <div className="w-10 h-10 rounded-full bg-[#FBBF24]/20 flex items-center justify-center text-[#FBBF24]">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-white">ساعت کاری و پاسخگویی</h2>
            <p className="text-xs sm:text-sm text-[#E8E2D9] leading-relaxed">
              {workingHours}
            </p>
          </div>

          {/* 3. Direct Contact Channels */}
          <div className="bg-black/35 border-2 border-white/20 p-6 space-y-3 shadow-xl">
            <div className="w-10 h-10 rounded-full bg-[#FBBF24]/20 flex items-center justify-center text-[#FBBF24]">
              <Phone className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-white">راه‌های ارتباطی</h2>
            <div className="space-y-2 pt-1">
              {channels.map((ch) => (
                <a
                  key={ch.id}
                  href={ch.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between text-xs sm:text-sm text-[#E8E2D9] hover:text-[#FBBF24] transition-colors py-1 group"
                >
                  <div className="flex items-center gap-2">
                    <ChannelIcon type={ch.type} className="w-4 h-4 text-[#FBBF24]" />
                    <span className="font-bold">{ch.label || ch.type}:</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-xs" dir="ltr">
                    <span>{ch.value}</span>
                    <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Map & Navigation Section */}
        <div className="bg-black/35 border-2 border-white/20 p-6 sm:p-10 space-y-8 shadow-2xl">
          <div className="space-y-1 border-b border-white/15 pb-4">
            <h2 className="text-2xl sm:text-3xl font-black text-[#FBBF24]">
              موقعیت مکانی روی نقشه
            </h2>
            <p className="text-xs sm:text-sm text-[#E8E2D9]/80">
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
