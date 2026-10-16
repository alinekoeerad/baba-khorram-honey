'use client';

/**
 * Contact Map & Route Buttons Component (Phase 10 Tasks 3 & 4)
 *
 * Requirements:
 * - Lazy-loaded on scroll or tap (does not block LCP).
 * - OpenStreetMap tiles via env-configurable tile URL.
 * - Self-hosted / zero external CDN dependency.
 * - Marker placed at coordinates from settings.
 * - Static fallback card if tiles fail, offline, or JS is off.
 * - Route buttons below map: universal geo:, Google Maps, Waze, Neshan, Balad.
 */

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, ExternalLink, RefreshCw, AlertTriangle, X } from 'lucide-react';
import { PillButton } from '@/components/ui/pill-button';
import { toPersianDigits } from '@/lib/domain-utils';

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
  latitude = 35.8415,
  longitude = 50.9850,
  zoom = 15,
  siteNameFa,
  address = 'کرج، جهانشهر، بلوار مولانا',
  workingHours,
  tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
}: ContactMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Lazy loading via IntersectionObserver
  useEffect(() => {
    if (!containerRef.current || isLoaded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsLoaded(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isLoaded]);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    if (isModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Major 4 Routing Options
  const routingApps = [
    {
      name: 'نشان (Neshan)',
      desc: 'مسیریاب و نقشه ایرانی نشان',
      url: `https://nshn.ir/?lat=${latitude}&lng=${longitude}`,
      iconText: 'نشان',
      badgeClass: 'bg-[#00A859] text-white',
    },
    {
      name: 'بلد (Balad)',
      desc: 'نقشه و مسیریاب هوشمند بلد',
      url: `https://balad.ir/location?latitude=${latitude}&longitude=${longitude}`,
      iconText: 'بلد',
      badgeClass: 'bg-[#2E5BFF] text-white',
    },
    {
      name: 'گوگل مپ (Google Maps)',
      desc: 'Google Maps Navigation',
      url: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
      iconText: 'Google',
      badgeClass: 'bg-[#EA4335] text-white',
    },
    {
      name: 'ویز (Waze)',
      desc: 'Waze GPS Navigation & Traffic',
      url: `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`,
      iconText: 'Waze',
      badgeClass: 'bg-[#33CCFF] text-[#2B2017]',
    },
  ];

  // Slippy map tile calculations
  const lon2tile = (lon: number, z: number) => Math.floor(((lon + 180) / 360) * Math.pow(2, z));
  const lat2tile = (lat: number, z: number) =>
    Math.floor(
      ((1 -
        Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) /
        2) *
        Math.pow(2, z)
    );

  const centerTileX = lon2tile(longitude, currentZoom);
  const centerTileY = lat2tile(latitude, currentZoom);

  // 3x3 tile grid around center
  const tiles: Array<{ x: number; y: number; offsetX: number; offsetY: number }> = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      tiles.push({
        x: centerTileX + dx,
        y: centerTileY + dy,
        offsetX: dx * 256,
        offsetY: dy * 256,
      });
    }
  }

  const getTileUrl = (x: number, y: number, z: number) => {
    return tileUrl.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));
  };

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Map Display Container: Warm Ivory Frame */}
      <div className="relative w-full h-80 sm:h-96 bg-[#FAF7F2] border-2 border-[#EFE9E0] overflow-hidden shadow-md rounded-none">
        {!isLoaded ? (
          /* Click or Scroll to Load Trigger */
          <div
            onClick={() => setIsLoaded(true)}
            className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center cursor-pointer hover:bg-[#FFFBEB] transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-[#FEF3C7] border border-[#F59E0B] flex items-center justify-center text-[#D97706] shadow-2xs">
              <MapPin className="w-6 h-6 animate-bounce" />
            </div>
            <p className="font-black text-[#2B2017] text-base">
              بارگذاری نقشه تعاملی موقعیت مکانی
            </p>
            <p className="text-xs text-[#786455] max-w-sm font-medium">
              برای مشاهده نقشه و مسیریابی لمس کنید یا به پایین اسکرول نمایید.
            </p>
          </div>
        ) : hasError ? (
          /* Static Fallback Card (if tiles fail or network offline) */
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-[#FAF7F2]">
            <AlertTriangle className="w-10 h-10 text-[#D97706]" />
            <h3 className="text-base font-black text-[#2B2017]">
              کارت موقعیت مکانی دفتر عسل باباخُرم
            </h3>
            <p className="text-xs sm:text-sm text-[#5C5248] max-w-md leading-relaxed font-medium">
              {address}
            </p>
            <div className="text-xs text-[#B45309] font-mono font-bold" dir="ltr">
              {latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E
            </div>
            <p className="text-[11px] text-[#786455]">
              (امکان بارگذاری تصویر نقشه وجود نداشت؛ لطفاً از دکمه‌های مسیریابی زیر استفاده فرمایید.)
            </p>
          </div>
        ) : (
          /* Interactive Tile Container */
          <div className="w-full h-full relative overflow-hidden bg-stone-100 select-none">
            {/* 3x3 Tile Grid */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-[768px] h-[768px]">
                {tiles.map((t) => (
                  <img
                    key={`${t.x}_${t.y}_${currentZoom}`}
                    src={getTileUrl(t.x, t.y, currentZoom)}
                    alt=""
                    onError={() => setHasError(true)}
                    className="absolute w-[256px] h-[256px] object-cover"
                    style={{
                      left: `calc(50% + ${t.offsetX - 128}px)`,
                      top: `calc(50% + ${t.offsetY - 128}px)`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Central Marker */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="flex flex-col items-center -translate-y-4 animate-in fade-in">
                <div className="px-3 py-1 bg-[#2B2017] border border-[#FBBF24] text-[#FBBF24] font-black text-xs shadow-lg mb-1 whitespace-nowrap">
                  {siteNameFa}
                </div>
                <MapPin className="w-9 h-9 text-[#DC2626] fill-[#DC2626] drop-shadow-md" />
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-1 shadow-md">
              <button
                type="button"
                onClick={() => setCurrentZoom((z) => Math.min(18, z + 1))}
                aria-label="بزرگ‌نمایی"
                className="w-8 h-8 bg-white hover:bg-[#FEF3C7] text-[#2B2017] font-black text-base flex items-center justify-center border border-[#EFE9E0] shadow-xs cursor-pointer"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setCurrentZoom((z) => Math.max(10, z - 1))}
                aria-label="کوچک‌نمایی"
                className="w-8 h-8 bg-white hover:bg-[#FEF3C7] text-[#2B2017] font-black text-base flex items-center justify-center border border-[#EFE9E0] shadow-xs cursor-pointer"
              >
                −
              </button>
            </div>

            {/* Tile Attribution */}
            <div className="absolute bottom-1 right-2 text-[9px] text-[#786455] bg-white/90 border border-[#EFE9E0] px-1.5 py-0.5 pointer-events-none z-10">
              © OpenStreetMap contributors
            </div>
          </div>
        )}
      </div>

      {/* Route Navigation Action */}
      <div className="flex flex-col items-center justify-center pt-2 space-y-3">
        <PillButton
          variant="gold"
          size="lg"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2.5 cursor-pointer shadow-md hover:shadow-lg active:scale-98 transition-all"
        >
          <Navigation className="w-4 h-4" />
          <span>مسیریابی مستقیم به کارگاه عسل باباخُرم</span>
        </PillButton>
        <p className="text-xs text-[#786455] font-medium">
          پشتیبانی از مسیریاب‌های نشان، بلد، گوگل مپ و ویز
        </p>
      </div>

      {/* Routing Choices Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white border-2 border-[#FDE68A] p-6 sm:p-8 max-w-md w-full shadow-2xl rounded-none text-right space-y-6 relative animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="routing-dialog-title"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 left-4 p-2 text-stone-400 hover:text-[#2B2017] transition-colors rounded-none cursor-pointer"
              aria-label="بستن پنجره"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 border-b border-[#EFE9E0] pb-4">
              <div className="w-10 h-10 rounded-full bg-[#FEF3C7] border border-[#F59E0B] flex items-center justify-center text-[#D97706] shrink-0">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <h3 id="routing-dialog-title" className="text-lg sm:text-xl font-black text-[#2B2017]">
                  انتخاب نرم‌افزار مسیریابی
                </h3>
                <p className="text-xs text-[#786455] mt-0.5 font-medium">
                  مسیریابی مستقیم تا کارگاه عسل طبیعی باباخُرم
                </p>
              </div>
            </div>

            {/* 4 Routing Apps List */}
            <div className="space-y-3">
              {routingApps.map((app) => (
                <a
                  key={app.name}
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsModalOpen(false)}
                  className="p-3.5 bg-[#FAF7F2] hover:bg-[#FEF3C7] border border-[#EFE9E0] hover:border-[#D97706] transition-all flex items-center justify-between group cursor-pointer rounded-none shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-none flex items-center justify-center font-black text-[11px] shadow-2xs shrink-0 ${app.badgeClass}`}
                    >
                      {app.iconText}
                    </div>
                    <div>
                      <div className="font-black text-sm text-[#2B2017] group-hover:text-[#92400E] transition-colors">
                        {app.name}
                      </div>
                      <div className="text-[11px] text-[#786455] font-medium">
                        {app.desc}
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-[#786455] group-hover:text-[#92400E] transition-colors shrink-0" />
                </a>
              ))}
            </div>

            {/* Address Footer Summary */}
            <div className="pt-2 border-t border-[#EFE9E0] text-[11px] text-[#786455] leading-relaxed">
              <span className="font-bold text-[#2B2017]">آدرس کارگاه:</span> {address}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
