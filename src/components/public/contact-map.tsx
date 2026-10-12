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
import { MapPin, Navigation, ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react';
import { toPersianDigits } from '@/lib/domain-utils';

export interface ContactMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  siteNameFa: string;
  address: string;
  workingHours?: string | null;
  tileUrl?: string;
}

export function ContactMap({
  latitude,
  longitude,
  zoom = 14,
  siteNameFa,
  address,
  workingHours,
  tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
}: ContactMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(zoom);

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

  // Verified Route Links (Addendum / Task 4)
  const routeLinks = [
    {
      name: 'مسیریاب گوشی (Universal geo:)',
      url: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(siteNameFa)})`,
      variant: 'primary',
      badge: 'پیش‌فرض موبایل',
    },
    {
      name: 'گوگل مپ (Google Maps)',
      url: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
      variant: 'google',
    },
    {
      name: 'ویز (Waze)',
      url: `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`,
      variant: 'waze',
    },
    {
      name: 'نشان (Neshan)',
      url: `https://nshn.ir/?lat=${latitude}&lng=${longitude}`,
      variant: 'neshan',
    },
    {
      name: 'بلد (Balad)',
      url: `https://balad.ir/location?latitude=${latitude}&longitude=${longitude}`,
      variant: 'balad',
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
      {/* Map Display Container */}
      <div className="relative w-full h-80 sm:h-96 bg-black/40 border-2 border-white/25 overflow-hidden shadow-2xl rounded-none">
        {!isLoaded ? (
          /* Click or Scroll to Load Trigger */
          <div
            onClick={() => setIsLoaded(true)}
            className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center cursor-pointer hover:bg-black/50 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-[#FBBF24]/20 flex items-center justify-center text-[#FBBF24]">
              <MapPin className="w-6 h-6 animate-bounce" />
            </div>
            <p className="font-black text-white text-base">
              بارگذاری نقشه تعاملی موقعیت مکانی
            </p>
            <p className="text-xs text-[#E8E2D9]/80 max-w-sm">
              برای مشاهده نقشه و مسیریابی لمس کنید یا به پایین اسکرول نمایید.
            </p>
          </div>
        ) : hasError ? (
          /* Static Fallback Card (if tiles fail or network offline) */
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-black/60">
            <AlertTriangle className="w-10 h-10 text-[#FBBF24]" />
            <h3 className="text-base font-black text-white">
              کارت موقعیت مکانی دفتر عسل باباخُرم
            </h3>
            <p className="text-xs sm:text-sm text-[#E8E2D9] max-w-md leading-relaxed">
              {address}
            </p>
            <div className="text-xs text-[#FBBF24] font-mono" dir="ltr">
              {latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E
            </div>
            <p className="text-[11px] text-white/60">
              (امکان بارگذاری تصویر نقشه وجود نداشت؛ لطفاً از دکمه‌های مسیریابی زیر استفاده فرمایید.)
            </p>
          </div>
        ) : (
          /* Interactive Tile Container */
          <div className="w-full h-full relative overflow-hidden bg-stone-900 select-none">
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
                className="w-8 h-8 bg-black/75 hover:bg-black text-white font-black text-base flex items-center justify-center border border-white/20"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setCurrentZoom((z) => Math.max(10, z - 1))}
                aria-label="کوچک‌نمایی"
                className="w-8 h-8 bg-black/75 hover:bg-black text-white font-black text-base flex items-center justify-center border border-white/20"
              >
                −
              </button>
            </div>

            {/* Tile Attribution */}
            <div className="absolute bottom-1 right-2 text-[9px] text-white/70 bg-black/60 px-1.5 py-0.5 pointer-events-none z-10">
              © OpenStreetMap contributors
            </div>
          </div>
        )}
      </div>

      {/* Route Navigation Buttons */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#FBBF24]">
          <Navigation className="w-4 h-4" />
          <span>مسیریابی مستقیم با برنامه‌های ناوبری:</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {routeLinks.map((route, idx) => (
            <a
              key={idx}
              href={route.url}
              target={route.url.startsWith('geo:') ? '_self' : '_blank'}
              rel="noopener noreferrer"
              className="p-3 bg-black/35 hover:bg-black/60 border border-white/20 hover:border-[#FBBF24] text-white text-xs font-bold transition-all flex flex-col items-center justify-center text-center gap-1.5 shadow group"
            >
              <span className="group-hover:text-[#FBBF24] transition-colors">
                {route.name}
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-white/50 group-hover:text-[#FBBF24]" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
