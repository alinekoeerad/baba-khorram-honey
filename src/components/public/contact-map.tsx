'use client';

/**
 * Contact Map & Route Buttons Component (Phase 10 Tasks 3 & 4 - Luxury Map Theme & Navigation Pass)
 *
 * Requirements:
 * - CartoDB Voyager tiles (https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png) with fallback to OSM.
 * - Subtle warm CSS filter (sepia(12%) contrast(103%) saturate(108%)) harmonizing with the honey palette.
 * - Custom luxury SVG Map Pin Marker (dark chocolate #2B2017 & gold honeycomb drop with pulse ring).
 * - Styled RTL popup: "فروشگاه عسل باباخُرم - کرج، جهانشهر، بلوار مولانا".
 * - Smart Navigation Launcher 4-card grid: Neshan, Balad, Google Maps, Waze with brand badge and "مسیریابی ←".
 */

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, AlertTriangle } from 'lucide-react';
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
  siteNameFa = 'عسل باباخُرم',
  address = 'کرج، جهانشهر، بلوار مولانا',
  workingHours,
  tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
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

  // Major 4 Routing Options
  const routingApps = [
    {
      name: 'مسیریاب نشان (Neshan)',
      desc: 'نقشه و راهنمای صوتی ایرانی',
      url: `https://nshn.ir/?lat=${latitude}&lng=${longitude}`,
      iconText: 'نشان',
      badgeClass: 'bg-[#00A859] text-white',
    },
    {
      name: 'مسیریاب بلد (Balad)',
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
    const subdomains = ['a', 'b', 'c', 'd'];
    const s = subdomains[Math.abs(x + y) % subdomains.length];
    return tileUrl
      .replace('{s}', s)
      .replace('{z}', String(z))
      .replace('{x}', String(x))
      .replace('{y}', String(y))
      .replace('{r}', '');
  };

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Map Display Container: Warm Ivory Frame */}
      <div className="relative w-full h-80 sm:h-96 bg-[#FAF7F2] border-2 border-[#D4AF37]/50 overflow-hidden shadow-md rounded-none">
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
              بارگذاری نقشه موقعیت مکانی فروشگاه
            </p>
            <p className="text-xs text-[#5C5248] max-w-sm font-medium">
              برای مشاهده نقشه زنده و مسیریابی لمس کنید یا به پایین اسکرول نمایید.
            </p>
          </div>
        ) : hasError ? (
          /* Static Fallback Card (if tiles fail or network offline) */
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-[#FAF7F2]">
            <AlertTriangle className="w-10 h-10 text-[#D97706]" />
            <h3 className="text-base font-black text-[#2B2017]">
              کارت موقعیت مکانی فروشگاه عسل باباخُرم
            </h3>
            <p className="text-xs sm:text-sm text-[#5C5248] max-w-md leading-relaxed font-medium">
              {address}
            </p>
            <div className="text-xs text-[#B45309] font-mono font-bold" dir="ltr">
              {latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E
            </div>
            <p className="text-[11px] text-[#786455]">
              (امکان بارگذاری تصویر نقشه وجود نداشت؛ لطفاً از گزینه‌های مسیریابی زیر استفاده فرمایید.)
            </p>
          </div>
        ) : (
          /* Interactive Tile Container */
          <div className="w-full h-full relative overflow-hidden bg-stone-100 select-none">
            {/* 3x3 Tile Grid with Warm Honey Sepia Palette Filter */}
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ filter: 'sepia(12%) contrast(103%) saturate(108%)' }}
            >
              <div className="relative w-[768px] h-[768px]">
                {tiles.map((t) => (
                  <img
                    key={`${t.x}_${t.y}_${currentZoom}`}
                    src={getTileUrl(t.x, t.y, currentZoom)}
                    alt=""
                    onError={(e) => {
                      // Fallback to standard OSM tiles if CartoDB tile fails
                      const target = e.currentTarget;
                      const osmFallback = `https://tile.openstreetmap.org/${currentZoom}/${t.x}/${t.y}.png`;
                      if (target.src !== osmFallback) {
                        target.src = osmFallback;
                      } else {
                        setHasError(true);
                      }
                    }}
                    className="absolute w-[256px] h-[256px] object-cover"
                    style={{
                      left: `calc(50% + ${t.offsetX - 128}px)`,
                      top: `calc(50% + ${t.offsetY - 128}px)`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Custom Luxury SVG Map Pin Marker & RTL Popup */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="flex flex-col items-center -translate-y-6 animate-in fade-in duration-300">
                {/* Styled RTL Popup */}
                <div className="relative mb-2 filter drop-shadow-lg">
                  <div className="px-3.5 py-1.5 bg-[#2B2017] border border-[#D4AF37] text-[#FFFBEB] font-black text-xs shadow-xl flex items-center gap-2 rounded-none whitespace-nowrap">
                    <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                    <span>فروشگاه عسل باباخُرم - کرج، جهانشهر، بلوار مولانا</span>
                  </div>
                  {/* Little bottom triangle pointer */}
                  <div className="w-2.5 h-2.5 bg-[#2B2017] border-b border-r border-[#D4AF37] rotate-45 mx-auto -mt-1" />
                </div>

                {/* Pin with Animated Pulse Ring */}
                <div className="relative flex items-center justify-center">
                  {/* Outer animated pulse ring */}
                  <span className="absolute -bottom-1 w-7 h-3 bg-[#D97706]/40 rounded-full animate-ping pointer-events-none" />
                  <span className="absolute -bottom-1 w-8 h-3.5 bg-[#2B2017]/30 rounded-full blur-[2px] pointer-events-none" />

                  {/* Luxury Honey Drop / Pin SVG */}
                  <svg
                    className="w-10 h-12 filter drop-shadow-md transition-transform duration-300 hover:scale-110"
                    viewBox="0 0 36 44"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient id="pinGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FBBF24" />
                        <stop offset="50%" stopColor="#D4AF37" />
                        <stop offset="100%" stopColor="#B45309" />
                      </linearGradient>
                      <linearGradient id="honeycombGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFFBEB" />
                        <stop offset="100%" stopColor="#F59E0B" />
                      </linearGradient>
                    </defs>
                    {/* Pin Outer Teardrop Body */}
                    <path
                      d="M18 42C18 42 32 26.5 32 16C32 8.26801 25.732 2 18 2C10.268 2 4 8.26801 4 16C4 26.5 18 42 18 42Z"
                      fill="#2B2017"
                      stroke="url(#pinGoldGrad)"
                      strokeWidth="2.5"
                    />
                    {/* Inner Golden Honeycomb Hexagon */}
                    <polygon
                      points="18,8 24,11.5 24,18.5 18,22 12,18.5 12,11.5"
                      fill="url(#honeycombGrad)"
                      stroke="#92400E"
                      strokeWidth="0.8"
                    />
                    {/* Honeycomb Center Droplet */}
                    <circle cx="18" cy="15" r="2.2" fill="#2B2017" />
                  </svg>
                </div>
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
            <div className="absolute bottom-1 right-2 text-[9px] text-[#786455] bg-white/90 border border-[#EFE9E0] px-1.5 py-0.5 pointer-events-none z-10 font-sans">
              © CartoDB Voyager | © OpenStreetMap contributors
            </div>
          </div>
        )}
      </div>

      {/* 2. Structured Smart Navigation App Launcher Card Grid */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-[#EFE9E0] pb-2.5">
          <div className="flex items-center gap-2 text-[#2B2017] font-black text-sm sm:text-base">
            <Navigation className="w-4 h-4 text-[#D97706]" />
            <span>مسیریابی هوشمند تا فروشگاه</span>
          </div>
          <span className="text-xs text-[#5C5248] font-medium hidden sm:inline">
            انتخاب مستقیم نقشه یا اپلیکیشن مورد علاقه شما
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
          {latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E
        </div>
      </div>
    </div>
  );
}
