/**
 * Authentic honey.com Footer Component (Vertical Multi-Column Architecture)
 *
 * Requirements:
 * - 5px honey gold top border
 * - Deep chocolate brown background (#332115)
 * - Multi-Column Vertical Navigation Grid (like honey.com):
 *   Column 1: پیوندهای اصلی (Primary Navigation - vertical)
 *   Column 2: صنعت و همکاران (Industry & Partners - vertical)
 *   Column 3: اصالت و کیفیت (Quality & Standards - vertical)
 *   Column 4: راه‌های ارتباط و خرید (Contact & Order Channels - vertical)
 * - Bottom row with brand logo emblem, circular social buttons, and copyright.
 */

import React from 'react';
import Link from 'next/link';
import { SiteSettingsData } from '@/server/services/settings-service';
import { PublicChannelItem } from '@/server/queries/settings';
import { ChannelIcon } from './channel-icon';

interface FooterProps {
  settings: SiteSettingsData;
  channels: PublicChannelItem[];
}

export function Footer({ settings, channels }: FooterProps) {
  const currentYear = 1405; // Solar Hijri brand year
  const footerLogoSrc =
    typeof settings.footerLogo === 'string'
      ? settings.footerLogo
      : settings.footerLogo?.storageKey
        ? `/uploads/${settings.footerLogo.storageKey}`
        : (settings.footerLogo?.url || '/images/footer-logo.webp');

  return (
    <footer className="bg-[#332115] text-[#E6DDD4] border-t-4 border-[#F59E0B] pt-14 pb-10 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Multi-Column Vertical Navigation Grid (Per user request: Vertical Layout like honey.com) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 pb-10 border-b border-white/15">
          {/* Column 1: پیوندهای اصلی (Primary Navigation - Vertical) */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-[#FBBF24] tracking-wider border-b border-white/10 pb-2">
              پیوندهای اصلی
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm font-black flex flex-col">
              <li>
                <Link href="/" className="text-white hover:text-[#FBBF24] transition-colors">
                  صفحه اصلی
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-white hover:text-[#FBBF24] transition-colors">
                  محصولات عسل
                </Link>
              </li>
              <li>
                <Link href="/recipes" className="text-white hover:text-[#FBBF24] transition-colors">
                  دستور پخت‌ها و دسرها
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-white hover:text-[#FBBF24] transition-colors">
                  تماس با ما
                </Link>
              </li>
              <li>
                <Link href="/feedback" className="text-white hover:text-[#FBBF24] transition-colors">
                  انتقادات و پیشنهادات
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: انواع عسل طبیعی ایرانی (Authentic Iranian Honey Varieties - SEC-06) */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-[#FBBF24] tracking-wider border-b border-white/10 pb-2">
              انواع عسل طبیعی باباخُرم
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm font-bold flex flex-col text-white/95">
              <li>
                <Link href="/products/astragalus" className="hover:text-[#FBBF24] transition-colors">
                  عسل طبیعی گون کوهستان
                </Link>
              </li>
              <li>
                <Link href="/products/ziziphus" className="hover:text-[#FBBF24] transition-colors">
                  عسل وحشی کنار (سدر) جنوب
                </Link>
              </li>
              <li>
                <Link href="/products/thymus" className="hover:text-[#FBBF24] transition-colors">
                  عسل آویشن وحشی البرز
                </Link>
              </li>
              <li>
                <Link href="/products/multi-plants" className="hover:text-[#FBBF24] transition-colors">
                  عسل چهل‌گیاه ییلاقی ارسباران
                </Link>
              </li>
              <li>
                <Link href="/products?q=موم" className="hover:text-[#FBBF24] transition-colors">
                  عسل طبیعی با موم کوهی
                </Link>
              </li>
              <li>
                <Link href="/products/citrus-bigaradia" className="hover:text-[#FBBF24] transition-colors">
                  عسل معطر بهارنارنج و مرکبات
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: درباره مجموعه و کیفیت (Quality & Authenticity - Vertical) */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-[#FBBF24] tracking-wider border-b border-white/10 pb-2">
              اصالت و تضمین کیفیت
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm font-black flex flex-col text-white/95">
              <li>
                <span className="text-white/90">برگه آزمایش ساکارز زیر ۲٪</span>
              </li>
              <li>
                <span className="text-white/90">برداشت مستقیم از مراتع ییلاقی</span>
              </li>
              <li>
                <span className="text-white/90">زنبورداری ارگانیک و پایدار</span>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  ضمانت بازگشت و کیفیت
                </Link>
              </li>
              <li>
                <Link href="/feedback" className="hover:text-white transition-colors">
                  رسیدگی به شکایات و نظرات
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: راه‌های ارتباط و سفارش (Contact & Ordering - Vertical) */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-[#FBBF24] tracking-wider border-b border-white/10 pb-2">
              راه‌های ارتباط و خرید
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm font-black flex flex-col text-white/95">
              <li>
                <a
                  href="tel:09389196010"
                  className="hover:text-white transition-colors font-mono font-bold text-white"
                  dir="ltr"
                >
                  ۰۹۳۸ ۹۱۹ ۶۰۱۰
                </a>
              </li>
              {channels && channels.length > 0 ? (
                channels.map((ch) => (
                  <li key={ch.id}>
                    <a
                      href={ch.url}
                      target={ch.type === 'PHONE' ? undefined : '_blank'}
                      rel={ch.type === 'PHONE' ? undefined : 'noopener noreferrer'}
                      className="hover:text-white transition-colors flex items-center gap-2"
                    >
                      <ChannelIcon type={ch.type} className="w-3.5 h-3.5 text-[#FBBF24]" />
                      <span>{ch.label || ch.type}</span>
                    </a>
                  </li>
                ))
              ) : (
                <>
                  <li>
                    <a href="https://wa.me/989389196010" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-2">
                      <ChannelIcon type="WHATSAPP" className="w-3.5 h-3.5 text-[#FBBF24]" />
                      <span>پیام‌رسان واتساپ</span>
                    </a>
                  </li>
                  <li>
                    <a href="https://t.me/Babakhoram9" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-2">
                      <ChannelIcon type="TELEGRAM" className="w-3.5 h-3.5 text-[#FBBF24]" />
                      <span>تلگرام پشتیبانی</span>
                    </a>
                  </li>
                  <li>
                    <a href="https://eitaa.com/Babakhoram" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-2">
                      <ChannelIcon type="EITAA" className="w-3.5 h-3.5 text-[#FBBF24]" />
                      <span>کانال ایتا</span>
                    </a>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Row 2: Bottom Row with Brand Logo, Circular Social Buttons, and Copyright */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src={footerLogoSrc}
              alt={settings.siteNameFa}
              width={96}
              height={96}
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain shadow-md"
            />
            <div className="flex flex-col text-right">
              <span className="text-lg font-black text-white tracking-tight group-hover:text-[#FBBF24] transition-colors">
                {settings.siteNameFa}
              </span>
              <span className="text-[10px] text-[#FEF3C7] font-semibold tracking-wider uppercase">
                {settings.tagline || 'طعم اصیل و طبیعی کوهستان'}
              </span>
            </div>
          </Link>

          {/* Social Links (Authentic honey.com Circle Icon Buttons) */}
          <div className="flex items-center gap-2.5" aria-label="شبکه‌های اجتماعی">
            {channels.map((ch) => (
              <a
                key={ch.id}
                href={ch.url}
                target={ch.type === 'PHONE' ? undefined : '_blank'}
                rel={ch.type === 'PHONE' ? undefined : 'noopener noreferrer'}
                aria-label={ch.label || ch.type}
                title={ch.label || ch.type}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#F59E0B] text-white hover:text-[#332115] flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 shadow-xs"
              >
                <ChannelIcon type={ch.type} className="w-4 h-4" />
              </a>
            ))}
          </div>

          {/* Copyright and Admin Link */}
          <div className="text-center md:text-left text-xs text-white/85 space-y-1 font-bold">
            <p>
              © {currentYear} {settings.siteNameFa}. تمامی حقوق مادی و معنوی محفوظ است.
            </p>
            <div className="flex items-center justify-center md:justify-end gap-3 text-[11px] text-white/40">
              <Link href="/admin/login" className="hover:text-white/80 transition-colors">
                ورود به پنل مدیریت
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
