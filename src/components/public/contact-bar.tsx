/**
 * Authentic Top Utility / Contact Bar (honey.com Brand Fidelity)
 * Replicates the exact dark chocolate brown dropdown tab seen in the reference:
 * - Tab: #382013 with rounded bottom corner, white bold uppercase text, and down arrow.
 * - Open Menu: Matching #382013 panel with rounded bottom corner, amber header,
 *   full section links (CONSUMERS, FOOD PROCESSORS, FOODSERVICE, RETAIL, INDUSTRY, NUTRITION),
 *   plus verified direct contact channels & order messengers.
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { PublicChannelItem } from '@/server/queries/settings';
import { ChannelIcon } from './channel-icon';

interface ContactBarProps {
  channels: PublicChannelItem[];
}

const INDUSTRY_PARTNERS_LINKS = [
  { labelFa: 'مصرف‌کنندگان', labelEn: 'CONSUMERS', href: '/recipes' },
  { labelFa: 'فرآوری‌کنندگان مواد غذایی', labelEn: 'FOOD PROCESSORS', href: '/products' },
  { labelFa: 'خدمات غذایی و رستوران‌ها', labelEn: 'FOODSERVICE', href: '/products' },
  { labelFa: 'خرده‌فروشی و فروشگاهی', labelEn: 'RETAIL', href: '/products' },
  { labelFa: 'صنعت و تولید عسل', labelEn: 'INDUSTRY', href: '/products' },
  { labelFa: 'تغذیه و سلامت', labelEn: 'NUTRITION', href: '/recipes' },
];

export function ContactBar({ channels }: ContactBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative z-50 bg-[#24150C] border-b border-[#3D2517]/80 text-white select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-9">
        {/* Subtitle / Brand Tagline */}
        <div className="hidden sm:flex items-center gap-3 text-xs text-[#E8E2D9]/85 font-medium">
          <span className="font-bold text-[#FBBF24]">عسل باباخُرم</span>
          <span className="text-white/40">•</span>
          <span>شهد خالص کوهستان‌های ارسباران و سبلان</span>
        </div>

        {/* The Exact honey.com Tab (image_2fca16 & image_2fcd06) */}
        <div className="relative" ref={containerRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-haspopup="true"
            aria-label="منوی همکاران تجاری و راه‌های ارتباطی"
            className={`inline-flex items-center gap-2 px-4 py-1.5 text-xs font-black tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] ${
              isOpen
                ? 'bg-[#382013] text-[#F59E0B] rounded-t-lg'
                : 'bg-[#382013] hover:bg-[#4A2C1B] text-white rounded-b-lg shadow-sm'
            }`}
          >
            <span>INDUSTRY & PARTNERS</span>
            <span className="text-[10px] text-white/70 font-normal">|</span>
            <span className="text-[11px] font-bold">صنعت و همکاران</span>
            <svg
              className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#F59E0B]' : 'text-white'}`}
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>

          {/* Opened Menu Panel (image_2fcd06) */}
          {isOpen && (
            <div
              className="absolute left-0 sm:left-auto sm:right-0 top-full w-72 sm:w-80 bg-[#382013] text-white shadow-2xl rounded-b-2xl border-t border-black/20 py-3 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
              role="menu"
            >
              {/* Header Title in Amber Gold */}
              <div className="px-5 py-2 text-xs font-black text-[#F59E0B] tracking-wider border-b border-white/10 flex items-center justify-between">
                <span>INDUSTRY & PARTNERS</span>
                <span className="text-[10px] font-normal text-white/60">بخش همکاران</span>
              </div>

              {/* Six Canonical Honey.com Sections */}
              <div className="py-2">
                {INDUSTRY_PARTNERS_LINKS.map((item) => (
                  <Link
                    key={item.labelEn}
                    href={item.href}
                    role="menuitem"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between px-5 py-2.5 text-xs font-extrabold tracking-wider hover:bg-black/25 hover:text-[#FBBF24] transition-colors"
                  >
                    <span>{item.labelEn}</span>
                    <span className="text-[11px] font-medium text-white/70 group-hover:text-white">
                      {item.labelFa}
                    </span>
                  </Link>
                ))}
              </div>

              {/* Direct Contact & Order Channels */}
              {channels && channels.length > 0 && (
                <div className="mt-2 pt-2 border-t border-white/10">
                  <div className="px-5 py-1.5 text-[11px] font-black text-[#FBBF24] tracking-wider">
                    راه‌های ارتباط و سفارش مستقیم
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-white/5">
                    {channels.map((ch) => (
                      <a
                        key={ch.id}
                        href={ch.url}
                        target={ch.type === 'PHONE' ? undefined : '_blank'}
                        rel={ch.type === 'PHONE' ? undefined : 'noopener noreferrer'}
                        role="menuitem"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between px-5 py-2 hover:bg-black/25 text-xs font-bold transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="p-1 rounded-md bg-white/10 text-[#FBBF24] group-hover:bg-[#FBBF24] group-hover:text-[#382013] transition-colors shrink-0">
                            <ChannelIcon type={ch.type} className="w-3.5 h-3.5" />
                          </span>
                          <span className="truncate text-white/90 group-hover:text-white">
                            {ch.label || ch.type}
                          </span>
                        </div>
                        {ch.acceptsOrders && (
                          <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-600/50 shrink-0">
                            ثبت سفارش
                          </span>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
