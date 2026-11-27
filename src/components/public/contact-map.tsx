'use client';

/**
 * Contact Map & Route Buttons Component (Phase 10 Tasks 3 & 4)
 *
 * Robust, interactive embed map supporting OpenStreetMap & Google Maps views.
 * Eliminates CORS tile 403 errors and manual slippy calculation bugs.
 * Includes Smart Navigation Launcher grid for Neshan, Balad, Google Maps, and Waze.
 */

import React, { useState } from 'react';
import { MapPin, Navigation, ExternalLink, Layers, RefreshCw } from 'lucide-react';
import { parseLocalizedNumber } from '@/lib/domain-utils';

export interface ContactMapProps {
  latitude?: number;
  longitude?: number;
  zoom?: number;
  siteNameFa: string;
  address?: string;
  workingHours?: string | null;
  tileUrl?: string;
}

export function ContactMap({
  latitude = 35.8339878,
  longitude = 50.9915841,
  zoom = 16,
  siteNameFa = 'عسل باباخُرم',
  address = 'کرج، جهانشهر، بلوار مولانا',
  workingHours,
}: ContactMapProps) {
  const [mapProvider, setMapProvider] = useState<'osm' | 'google'>('osm');
  const [isLoading, setIsLoading] = useState(true);

  // Parse & guard coordinates to prevent NaN or non-finite errors
  const parsedLat = typeof latitude === 'number' ? latitude : parseLocalizedNumber(latitude);
  const parsedLng = typeof longitude === 'number' ? longitude : parseLocalizedNumber(longitude);
  const safeLat = Number.isFinite(parsedLat) ? parsedLat : 35.8339878;
  const safeLng = Number.isFinite(parsedLng) ? parsedLng : 50.9915841;

  // OpenStreetMap embed bbox calculation around store center
  const deltaLon = 0.007;
  const deltaLat = 0.004;
  const minLon = (safeLng - deltaLon).toFixed(6);
  const minLat = (safeLat - deltaLat).toFixed(6);
  const maxLon = (safeLng + deltaLon).toFixed(6);
  const maxLat = (safeLat + deltaLat).toFixed(6);

  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}&layer=mapnik&marker=${safeLat}%2C${safeLng}`;
  const googleEmbedUrl = `https://maps.google.com/maps?q=${safeLat},${safeLng}&hl=fa&z=${zoom}&output=embed`;

  // Major 4 Routing Options
  const routingApps = [
    {
      name: 'مسیریاب نشان (Neshan)',
      desc: 'نقشه و راهنمای صوتی ایرانی',
      url: `https://nshn.ir/?lat=${safeLat}&lng=${safeLng}`,
      iconText: 'نشان',
      badgeClass: 'bg-[#00A859] text-white',
    },
    {
      name: 'مسیریاب بلد (Balad)',
      desc: 'نقشه و مسیریاب هوشمند بلد',
      url: `https://balad.ir/location?latitude=${safeLat}&longitude=${safeLng}`,
      iconText: 'بلد',
      badgeClass: 'bg-[#2E5BFF] text-white',
    },
    {
      name: 'گوگل مپ (Google Maps)',
      desc: 'صفحه اختصاصی عسل باباخُرم در گوگل مپ',
      url: 'https://www.google.com/maps/place/%D8%B9%D8%B3%D9%84+%D8%A8%D8%A7%D8%A8%D8%A7%D8%AE%D8%B1%D9%85%E2%80%AD/@35.8336078,50.9902363,17.64z/data=!4m6!3m5!1s0x3f8dbf002df3abe9:0xf0a3e39932747914!8m2!3d35.8339878!4d50.9915841!16s%2Fg%2F11x2l52vmk',
      iconText: 'Google',
      badgeClass: 'bg-[#EA4335] text-white',
    },
    {
      name: 'ویز (Waze)',
      desc: 'Waze GPS Navigation & Traffic',
      url: `https://waze.com/ul?ll=${safeLat},${safeLng}&navigate=yes`,
      iconText: 'Waze',
      badgeClass: 'bg-[#33CCFF] text-[#2B2017]',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Map Header Controls: Provider Switcher Tabs & Direct Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-[#FAF6EE] border border-[#DFD3C3] shadow-xs w-fit">
          <Layers className="w-3.5 h-3.5 text-[#B45309] mx-1" />
          <button
            type="button"
            onClick={() => {
              if (mapProvider !== 'osm') {
                setIsLoading(true);
                setMapProvider('osm');
              }
            }}
            className={`px-3 py-1 text-xs font-black transition-colors cursor-pointer rounded-none ${
              mapProvider === 'osm'
                ? 'bg-[#2B2017] text-[#FFFBEB] shadow-xs'
                : 'text-[#5C3A21] hover:text-[#2B2017] hover:bg-[#FEF3C7]'
            }`}
          >
            نقشه آنلاین (OpenStreetMap)
          </button>
          <button
            type="button"
            onClick={() => {
              if (mapProvider !== 'google') {
                setIsLoading(true);
                setMapProvider('google');
              }
            }}
            className={`px-3 py-1 text-xs font-black transition-colors cursor-pointer rounded-none ${
              mapProvider === 'google'
                ? 'bg-[#2B2017] text-[#FFFBEB] shadow-xs'
                : 'text-[#5C3A21] hover:text-[#2B2017] hover:bg-[#FEF3C7]'
            }`}
          >
            گوگل مپ (Google Maps)
          </button>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`https://nshn.ir/?lat=${safeLat}&lng=${safeLng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#00A859] hover:bg-[#008f4c] text-white text-xs font-black shadow-xs transition-colors rounded-none"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>باز کردن در نشان</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href={`https://balad.ir/location?latitude=${safeLat}&longitude=${safeLng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2E5BFF] hover:bg-[#2047db] text-white text-xs font-black shadow-xs transition-colors rounded-none"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>باز کردن در بلد</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Map Display Frame: Warm Luxury Frame */}
      <div className="relative w-full h-80 sm:h-96 md:h-[420px] bg-[#FAF7F2] border-2 border-[#D4AF37]/60 overflow-hidden shadow-lg rounded-none">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#FAF7F2] text-[#2B2017] gap-3">
            <RefreshCw className="w-7 h-7 text-[#D9A441] animate-spin" />
            <p className="text-xs font-black text-[#5C3A21]">در حال بارگذاری نقشه موقعیت مکانی...</p>
          </div>
        )}

        {/* Embedded Interactive Map */}
        <iframe
          key={mapProvider}
          src={mapProvider === 'osm' ? osmEmbedUrl : googleEmbedUrl}
          title={`نقشه موقعیت مکانی ${siteNameFa}`}
          className="w-full h-full border-0"
          loading="lazy"
          onLoad={() => setIsLoading(false)}
        />

        {/* Floating Location Badge in Top Right Corner */}
        <div className="absolute top-3 right-3 z-10 pointer-events-none filter drop-shadow-md hidden sm:block">
          <div className="px-3.5 py-1.5 bg-[#2B2017]/95 border border-[#D4AF37] text-[#FFFBEB] font-black text-xs shadow-xl flex items-center gap-2 rounded-none">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
            <span>{siteNameFa} — {address}</span>
          </div>
        </div>
      </div>

      {/* 2. Structured Smart Navigation App Launcher Card Grid */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-[#EFE9E0] pb-2.5">
          <div className="flex items-center gap-2 text-[#2B2017] font-black text-sm sm:text-base">
            <Navigation className="w-4 h-4 text-[#D97706]" />
            <span>مسیریابی هوشمند تا فروشگاه</span>
          </div>
          <span className="text-xs text-[#5C5248] font-medium hidden sm:inline">
            مسیریابی مستقیم با برنامه‌های ناوبری
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {routingApps.map((app) => (
            <a
              key={app.name}
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-[#E5D5C5] bg-white hover:bg-[#FFFBEB] hover:border-[#D97706] text-[#2B2017] transition-all shadow-sm rounded-none p-3.5 sm:p-4 flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-none flex items-center justify-center font-black text-xs shadow-xs shrink-0 ${app.badgeClass}`}
                >
                  {app.iconText}
                </div>
                <div>
                  <div className="font-black text-sm text-[#2B2017] group-hover:text-[#B45309] transition-colors">
                    {app.name}
                  </div>
                  <div className="text-[11px] text-[#5C5248] font-medium">
                    {app.desc}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-black text-[#B45309] group-hover:text-[#D97706] transition-colors shrink-0">
                <span>مسیریابی</span>
                <span className="transition-transform duration-200 group-hover:-translate-x-1">←</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Address & Coordinates Summary Bar */}
      <div className="p-3.5 bg-[#FAF7F2] border border-[#EFE9E0] text-xs text-[#5C5248] flex flex-col sm:flex-row items-center justify-between gap-2 rounded-none">
        <div>
          <span className="font-bold text-[#2B2017]">نشانی دقیق فروشگاه:</span> {address}
        </div>
        <div className="text-[11px] text-[#B45309] font-mono font-bold" dir="ltr">
          {safeLat.toFixed(4)}° N, {safeLng.toFixed(4)}° E
        </div>
      </div>
    </div>
  );
}
