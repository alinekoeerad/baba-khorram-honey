/**
 * Header Component (Exact honey.com Architecture, Responsive & Adaptive)
 *
 * Rules:
 * 1. Desktop:
 *    - Preserves classic state: Hamburger button labeled "دسته‌بندی‌ها" (opens categories drawer).
 *    - Main navigation links visible in header with "|" dividers:
 *      صفحه اصلی | محصولات | دستورها و دسرها | تماس با ما | انتقادات و پیشنهادات | [جستجو]
 *    - Corner Contact Tab at top-0 left-0 with w-64 and rounded-br-2xl.
 *    - Cart island with lg:pl-64.
 * 2. Mobile (< lg):
 *    - Hamburger button labeled "منو" (opens header navigation drawer).
 *    - Header nav links hidden from header bar.
 *    - Search button next to Cart icon.
 *    - Sleek top utility bar with quick call and "ارتباط با ما".
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Menu, Phone, ChevronDown, PhoneCall } from 'lucide-react';
import { HeaderCartIcon } from './header-cart-icon';
import { PublicChannelItem, PublicMediaAssetInfo } from '@/server/queries/settings';
import { ChannelIcon } from './channel-icon';

interface HeaderProps {
  siteNameFa: string;
  cartEnabled: boolean;
  logo?: PublicMediaAssetInfo | null;
  channels?: PublicChannelItem[];
  onOpenSearch: () => void;
  onOpenHamburger: () => void;
  hamburgerButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

export function Header({
  siteNameFa,
  cartEnabled,
  logo,
  channels = [],
  onOpenSearch,
  onOpenHamburger,
  hamburgerButtonRef,
}: HeaderProps) {
  const pathname = usePathname();
  const [isContactOpen, setIsContactOpen] = useState(false);
  const desktopContactRef = useRef<HTMLDivElement>(null);
  const mobileContactRef = useRef<HTMLDivElement>(null);

  const headerLogoSrc =
    typeof logo === 'string'
      ? logo
      : logo?.storageKey
        ? `/uploads/${logo.storageKey}`
        : (logo?.url || '/images/header-logo.webp');

  // Close contact menu on outside click or Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const isInsideDesktop = desktopContactRef.current?.contains(target);
      const isInsideMobile = mobileContactRef.current?.contains(target);
      if (!isInsideDesktop && !isInsideMobile) {
        setIsContactOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isContactOpen) {
        setIsContactOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isContactOpen]);

  const navLinks = [
    { href: '/', label: 'صفحه اصلی' },
    { href: '/products', label: 'محصولات' },
    { href: '/recipes', label: 'دستورها و دسرها' },
    { href: '/contact', label: 'تماس با ما' },
    { href: '/feedback', label: 'انتقادات و پیشنهادات' },
  ];

  const contactListContent = (
    <div className="pt-1 pb-3 px-3 space-y-1 animate-in fade-in duration-150 border-t border-white/10">
      {/* Phone call link */}
      <a
        href="tel:09389196010"
        onClick={() => setIsContactOpen(false)}
        className="flex items-center justify-between px-3 py-2 text-xs font-black text-white hover:bg-black/25 hover:text-[#FBBF24] transition-colors rounded-none"
      >
        <span>تماس تلفنی</span>
        <span className="font-mono text-[11px] text-[#FBBF24]" dir="ltr">
          ۰۹۳۸ ۹۱۹ ۶۰۱۰
        </span>
      </a>

      {/* Messengers & Channels */}
      {channels && channels.length > 0 ? (
        channels.map((ch) => (
          <a
            key={ch.id}
            href={ch.url}
            target={ch.type === 'PHONE' ? undefined : '_blank'}
            rel={ch.type === 'PHONE' ? undefined : 'noopener noreferrer'}
            onClick={() => setIsContactOpen(false)}
            className="flex items-center justify-between px-3 py-2 text-xs font-black text-white hover:bg-black/25 hover:text-[#FBBF24] transition-colors rounded-none"
          >
            <div className="flex items-center gap-2">
              <ChannelIcon type={ch.type} className="w-3.5 h-3.5 text-[#FBBF24]" />
              <span>{ch.label || ch.type}</span>
            </div>

          </a>
        ))
      ) : (
        <>
          <a
            href="https://wa.me/989389196010"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsContactOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-black text-white hover:bg-black/25 hover:text-[#FBBF24] transition-colors rounded-none"
          >
            <ChannelIcon type="WHATSAPP" className="w-3.5 h-3.5 text-[#FBBF24]" />
            <span>پیام‌رسان واتساپ</span>
          </a>
          <a
            href="https://t.me/Babakhoram9"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsContactOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-black text-white hover:bg-black/25 hover:text-[#FBBF24] transition-colors rounded-none"
          >
            <ChannelIcon type="TELEGRAM" className="w-3.5 h-3.5 text-[#FBBF24]" />
            <span>تلگرام پشتیبانی</span>
          </a>
          <a
            href="https://eitaa.com/Babakhoram"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsContactOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-black text-white hover:bg-black/25 hover:text-[#FBBF24] transition-colors rounded-none"
          >
            <ChannelIcon type="EITAA" className="w-3.5 h-3.5 text-[#FBBF24]" />
            <span>کانال ایتا</span>
          </a>
        </>
      )}

      {/* Direct Pages */}
      <Link
        href="/contact"
        onClick={() => setIsContactOpen(false)}
        className="flex items-center px-3 py-2 text-xs font-black text-white hover:bg-black/25 hover:text-[#FBBF24] transition-colors rounded-none border-t border-white/10 mt-1"
      >
        <span>صفحه تماس و نقشه</span>
      </Link>
      <Link
        href="/feedback"
        onClick={() => setIsContactOpen(false)}
        className="flex items-center px-3 py-2 text-xs font-black text-white hover:bg-black/25 hover:text-[#FBBF24] transition-colors rounded-none"
      >
        <span>انتقادات و پیشنهادات</span>
      </Link>
    </div>
  );

  return (
    <header
      className="sticky top-0 z-40 text-white shadow-lg border-b border-[#B45309]/30 transition-all bg-[#F59E0B] bg-cover bg-center relative"
      style={{
        backgroundImage: "url('/images/header-bg.jpg')",
      }}
    >
      {/* 
        1. Desktop Morphing Corner Contact Panel (image_9e25b5 & image_9e285a)
        - Active on lg: screens (desktop).
        - Pinned to exact TOP-LEFT corner (top-0 left-0).
        - EXACT EQUAL WIDTH for both open and closed states (w-60 sm:w-64).
        - ONLY the bottom-right corner is rounded (rounded-br-2xl).
        - Clean, bold items without extra text fluff or internal scrollbars.
      */}
      <div
        ref={desktopContactRef}
        className={`hidden lg:block absolute top-0 left-0 z-50 bg-[#382013] text-white shadow-2xl transition-all duration-300 ease-out border-b border-r border-black/30 select-none w-60 sm:w-64 rounded-none rounded-br-2xl overflow-hidden ${
          isContactOpen ? 'max-h-[500px]' : 'max-h-10'
        }`}
      >
        {/* Contact Tab Header / Trigger */}
        <button
          type="button"
          onClick={() => setIsContactOpen(!isContactOpen)}
          aria-expanded={isContactOpen}
          aria-label="منوی تماس و ارتباط با ما"
          className="flex items-center justify-between w-full h-10 px-4 text-xs font-black tracking-wide text-white hover:text-[#FBBF24] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-[#FBBF24] shrink-0" />
            <span className="font-black text-xs">ارتباط با ما</span>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-300 ${
              isContactOpen ? 'rotate-180 text-[#FBBF24]' : 'text-white/80'
            }`}
          />
        </button>

        {isContactOpen && contactListContent}
      </div>

      {/* 
        2. Mobile Top Utility Bar (< lg)
        - Clean dark chocolate bar (#2C180E) ensuring no element collision on small screens.
        - Provides immediate phone calling and expandable contact drawer.
      */}
      <div className="lg:hidden bg-[#2C180E] text-white border-b border-black/30 px-3 py-1.5 flex items-center justify-between text-xs relative z-50 select-none">
        {/* Contact Menu Trigger Button */}
        <div className="relative" ref={mobileContactRef}>
          <button
            type="button"
            onClick={() => setIsContactOpen(!isContactOpen)}
            aria-expanded={isContactOpen}
            aria-label="منوی ارتباط با ما"
            className="flex items-center gap-1.5 font-black text-white hover:text-[#FBBF24] transition-colors cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5 text-[#FBBF24] shrink-0" />
            <span>ارتباط با ما</span>
            <ChevronDown
              className={`w-3 h-3 text-white/80 transition-transform duration-300 ${
                isContactOpen ? 'rotate-180 text-[#FBBF24]' : ''
              }`}
            />
          </button>

          {/* Mobile Contact Dropdown Menu */}
          {isContactOpen && (
            <div className="absolute top-full right-0 mt-1.5 z-50 w-64 max-w-[90vw] bg-[#382013] text-white shadow-2xl border border-black/30 rounded-none overflow-hidden animate-in fade-in duration-150 p-1">
              {contactListContent}
            </div>
          )}
        </div>

        {/* Quick Phone Call Link */}
        <a
          href="tel:09389196010"
          className="flex items-center gap-1.5 text-[11px] font-black text-white/90 hover:text-[#FBBF24] transition-colors"
          dir="ltr"
        >
          <span className="font-mono">۰۹۳۸ ۹۱۹ ۶۰۱۰</span>
          <PhoneCall className="w-3 h-3 text-[#FBBF24]" />
        </a>
      </div>

      {/* 3. Main Header Container */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3 sm:gap-6 relative">
        {/* Right Section in RTL: Hamburger Button directly at far-right edge, followed by Brand Logo & Title */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0 min-w-max">
          {/* Hamburger Trigger: "منو" on mobile, "دسته‌بندی‌ها" on desktop */}
          <button
            ref={hamburgerButtonRef}
            type="button"
            onClick={onOpenHamburger}
            aria-label="باز کردن منوی سایت"
            className="flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-none hover:bg-black/20 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer select-none shrink-0 group ml-1 sm:ml-2"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-sm group-hover:scale-105 transition-transform" />
            <span className="text-[10px] sm:text-xs font-black text-white mt-0.5 tracking-tight whitespace-nowrap">
              <span className="lg:hidden">منو</span>
              <span className="hidden lg:inline">دسته‌بندی‌ها</span>
            </span>
          </button>

          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0 min-w-max">
            {/* Dedicated Brand Emblem (Crisp High-DPI 3x/4x DPR) */}
            <img
              src={headerLogoSrc}
              alt={siteNameFa}
              width={160}
              height={160}
              decoding="async"
              fetchPriority="high"
              className="h-11 w-11 sm:h-12 sm:w-12 object-contain shrink-0 group-hover:scale-105 transition-transform"
            />

            <div className="flex flex-col text-right shrink-0 whitespace-nowrap">
              <span className="text-base sm:text-2xl font-black text-white tracking-tight drop-shadow-md group-hover:text-[#FFF6D6] transition-colors leading-tight whitespace-nowrap">
                {siteNameFa}
              </span>
              <span className="text-[10px] sm:text-[11px] text-[#FEF3C7] tracking-wider font-bold drop-shadow-xs hidden xs:inline whitespace-nowrap">
                طعم اصیل و طبیعی کوهستان
              </span>
            </div>
          </Link>
        </div>

        {/* Center Section: Desktop Main Navigation with "|" Dividers and Search */}
        <nav className="hidden lg:flex items-center text-sm xl:text-base font-black shrink min-w-0" aria-label="ناوبری اصلی">
          {navLinks.map((link, idx) => {
            const isActive = pathname === link.href;
            return (
              <React.Fragment key={link.href}>
                {idx > 0 && (
                  <span className="mx-2 sm:mx-2.5 text-white/90 font-black text-base select-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]" aria-hidden="true">|</span>
                )}
                <Link
                  href={link.href}
                  className={`transition-colors py-1 text-xs xl:text-sm whitespace-nowrap ${
                    isActive
                      ? "font-black text-white underline underline-offset-8 decoration-[3px] decoration-[#FFF6D6] drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
                      : "font-black text-white hover:text-[#FFF6D6] drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]"
                  }`}
                >
                  {link.label}
                </Link>
              </React.Fragment>
            );
          })}

          {/* Thick bold | divider before Search Button */}
          <span className="mx-2 sm:mx-2.5 text-white/90 font-black text-base select-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]" aria-hidden="true">|</span>

          {/* Search Trigger Button inside nav (Desktop) */}
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="جستجوی محصولات و مقالات"
            className="flex items-center gap-1.5 py-1 px-1.5 text-white hover:text-[#FFF6D6] transition-colors cursor-pointer group whitespace-nowrap"
          >
            <Search className="w-4 h-4 stroke-[3] text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)] group-hover:scale-110 transition-transform" />
            <span className="text-xs xl:text-sm font-black text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">جستجو</span>
          </button>
        </nav>

        {/* Left Section in RTL: Mobile Search Button + Cart Island (lg:pl-64 on desktop to clear corner tab) */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 lg:pl-64">
          {/* Mobile Search Trigger Button (< lg) */}
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="جستجوی محصولات و مقالات"
            className="lg:hidden p-2 hover:bg-black/20 rounded-none text-white hover:text-[#FFF6D6] transition-colors cursor-pointer shrink-0"
          >
            <Search className="w-5 h-5 drop-shadow-xs" />
          </button>

          {/* Cart Icon */}
          <HeaderCartIcon cartEnabled={cartEnabled} />
        </div>
      </div>
    </header>
  );
}
