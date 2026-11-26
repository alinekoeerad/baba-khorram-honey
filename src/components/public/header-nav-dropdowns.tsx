'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronLeft, BookOpen, HelpCircle, ShoppingBag, Sparkles } from 'lucide-react';
import {
  FAQ_DROPDOWN_ITEMS,
  MAGAZINE_DROPDOWN_ITEMS,
  MONOFLORAL_HONEY_LINKS,
  PRODUCT_DROPDOWN_ITEMS,
} from '@/content/navigation-menu';

type DropdownKey = 'products' | 'magazine' | 'faq' | null;

export interface HeaderNavDropdownsProps {
  pathname: string;
  publishedProductSlugs?: string[];
}

export function HeaderNavDropdowns({ pathname, publishedProductSlugs }: HeaderNavDropdownsProps) {
  const [openMenu, setOpenMenu] = useState<DropdownKey>(null);
  const [isMonofloralOpen, setIsMonofloralOpen] = useState(false);

  const publishedSlugSet = publishedProductSlugs ? new Set(publishedProductSlugs) : null;
  const visibleMonofloralLinks = publishedSlugSet
    ? MONOFLORAL_HONEY_LINKS.filter((item) =>
        publishedSlugSet.has(item.href.replace('/products/', ''))
      )
    : MONOFLORAL_HONEY_LINKS;
  const visibleProductDropdownItems = publishedSlugSet
    ? PRODUCT_DROPDOWN_ITEMS.filter((item) => {
        if (item.hasMonofloralSubmenu) return visibleMonofloralLinks.length > 0;
        if (item.href.startsWith('/products/') && !item.href.includes('?')) {
          return publishedSlugSet.has(item.href.replace('/products/', ''));
        }
        return true;
      })
    : PRODUCT_DROPDOWN_ITEMS;
  const navRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openDropdown = (key: Exclude<DropdownKey, null>) => {
    clearCloseTimer();
    setOpenMenu(key);
    if (key !== 'products') {
      setIsMonofloralOpen(false);
    }
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setOpenMenu(null);
      setIsMonofloralOpen(false);
    }, 160);
  };

  const closeAll = () => {
    clearCloseTimer();
    setOpenMenu(null);
    setIsMonofloralOpen(false);
  };

  useEffect(() => {
    closeAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        closeAll();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAll();
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      clearCloseTimer();
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const linkClass = (active: boolean) =>
    `transition-colors py-1 text-[11px] xl:text-[13px] 2xl:text-sm whitespace-nowrap ${
      active
        ? 'font-black text-white underline underline-offset-8 decoration-[3px] decoration-[#FFF6D6] drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]'
        : 'font-black text-white hover:text-[#FFF6D6] drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]'
    }`;

  const divider = (
    <span
      className="mx-1 xl:mx-1.5 2xl:mx-2.5 text-white/90 font-black text-sm xl:text-base select-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]"
      aria-hidden="true"
    >
      |
    </span>
  );

  return (
    <div ref={navRef} className="flex items-center">
      {/* 1. صفحه اصلی */}
      <Link href="/" className={linkClass(pathname === '/')}>
        صفحه اصلی
      </Link>

      {divider}

      {/* 2. محصولات + زیرمنوی عسل تک‌گیاه (۲۷ عسل) */}
      <div
        className="relative flex items-center"
        onMouseEnter={() => openDropdown('products')}
        onMouseLeave={scheduleClose}
      >
        <div className="flex items-center gap-0.5">
          <Link
            href="/products"
            onClick={closeAll}
            className={linkClass(pathname.startsWith('/products'))}
          >
            محصولات
          </Link>
          <button
            type="button"
            onClick={() =>
              openMenu === 'products' ? closeAll() : openDropdown('products')
            }
            aria-label="باز کردن زیرمنوی محصولات"
            aria-expanded={openMenu === 'products'}
            aria-haspopup="menu"
            className="p-0.5 text-white/95 hover:text-[#FFF6D6] transition-colors cursor-pointer"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-150 ${
                openMenu === 'products' ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {openMenu === 'products' && (
          <div
            role="menu"
            className="absolute top-full right-0 pt-2.5 z-50"
            onMouseEnter={() => openDropdown('products')}
            onMouseLeave={scheduleClose}
          >
            <div className="bg-[#FFFDF9] border-2 border-[#D9A441] rounded-none shadow-2xl text-[#2B2017] overflow-hidden">
              <div className="h-1 w-full bg-[#F59E0B]" />
              <div className="flex items-stretch">
                {/* Primary Products List */}
                <div className="w-56 xl:w-60 py-2 bg-[#FFFDF9] shrink-0">
                  <div className="px-3.5 py-1.5 text-[11px] font-black text-[#B45309] flex items-center gap-1.5 border-b border-[#EFE9E0]">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>محصولات زنبورستان باباخُرم</span>
                  </div>

                  <div className="py-1">
                    {visibleProductDropdownItems.map((item) => {
                      if (item.hasMonofloralSubmenu) {
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onMouseEnter={() => setIsMonofloralOpen(true)}
                            onClick={() => setIsMonofloralOpen((prev) => !prev)}
                            aria-expanded={isMonofloralOpen}
                            className={`w-full px-3.5 py-2.5 text-right text-xs font-black flex items-center justify-between transition-colors cursor-pointer border-r-2 ${
                              isMonofloralOpen
                                ? 'bg-[#FAF5EB] text-[#B45309] border-[#D97706]'
                                : 'text-[#2B2017] border-transparent hover:bg-[#FAF5EB] hover:text-[#B45309] hover:border-[#D97706]'
                            }`}
                          >
                            <span>{item.label}</span>
                            <ChevronLeft className="w-4 h-4 text-[#D97706]" />
                          </button>
                        );
                      }

                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          onMouseEnter={() => setIsMonofloralOpen(false)}
                          onClick={closeAll}
                          className="w-full px-3.5 py-2.5 text-xs font-bold text-[#2B2017] hover:bg-[#FAF5EB] hover:text-[#B45309] border-r-2 border-transparent hover:border-[#D97706] flex items-center justify-between gap-2 transition-colors"
                        >
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="px-1.5 py-0.5 text-[10px] font-black bg-[#FAF5EB] border border-[#D9A441]/50 text-[#B45309] rounded-none">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>

                  <div className="px-3.5 pt-2 pb-1.5 border-t border-[#EFE9E0]">
                    <Link
                      href="/products"
                      onClick={closeAll}
                      className="text-[11px] font-black text-[#B45309] hover:text-[#78350F] flex items-center justify-between"
                    >
                      <span>همه محصولات (از جمله عسل عناب)</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Expandable Nested Panel: 27 Monofloral Honeys */}
                {isMonofloralOpen && (
                  <div className="w-[460px] xl:w-[540px] max-w-[calc(100vw-20rem)] bg-[#FAF6EE] border-r-2 border-[#D9A441] p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#EFE9E0] pb-2">
                      <span className="text-xs font-black text-[#3F2A1D] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
                        عسل‌های تک‌گیاه طبیعی (۲۷ گونه)
                      </span>
                      <Link
                        href="/products?category=honey-types"
                        onClick={closeAll}
                        className="text-[11px] font-black text-[#B45309] hover:underline flex items-center gap-0.5"
                      >
                        مشاهده دسته‌بندی عسل‌ها
                        <ChevronLeft className="w-3 h-3" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 xl:grid-cols-3 gap-1.5 max-h-[60vh] overflow-y-auto pl-1">
                      {visibleMonofloralLinks.map((honey) => (
                        <Link
                          key={honey.href}
                          href={honey.href}
                          onClick={closeAll}
                          className="px-2.5 py-2 text-[11px] xl:text-xs font-bold bg-white border border-[#EFE9E0] text-[#3F2A1D] hover:bg-[#F59E0B] hover:border-[#D97706] hover:text-[#2B2017] rounded-none transition-colors truncate"
                          title={honey.label}
                        >
                          {honey.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {divider}

      {/* 3. دستورها و دسرها */}
      <Link
        href="/recipes"
        onClick={closeAll}
        className={linkClass(pathname.startsWith('/recipes'))}
      >
        دستورها و دسرها
      </Link>

      {divider}

      {/* 4. مجله علمی (زیرمنو ۷ مقاله) */}
      <div
        className="relative flex items-center"
        onMouseEnter={() => openDropdown('magazine')}
        onMouseLeave={scheduleClose}
      >
        <div className="flex items-center gap-0.5">
          <Link
            href="/magazine"
            onClick={closeAll}
            className={linkClass(pathname.startsWith('/magazine'))}
          >
            مجله علمی
          </Link>
          <button
            type="button"
            onClick={() =>
              openMenu === 'magazine' ? closeAll() : openDropdown('magazine')
            }
            aria-label="باز کردن زیرمنوی مجله علمی"
            aria-expanded={openMenu === 'magazine'}
            aria-haspopup="menu"
            className="p-0.5 text-white/95 hover:text-[#FFF6D6] transition-colors cursor-pointer"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-150 ${
                openMenu === 'magazine' ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {openMenu === 'magazine' && (
          <div
            role="menu"
            className="absolute top-full right-0 pt-2.5 z-50"
            onMouseEnter={() => openDropdown('magazine')}
            onMouseLeave={scheduleClose}
          >
            <div className="w-72 bg-[#FFFDF9] border-2 border-[#D9A441] rounded-none shadow-2xl text-[#2B2017] overflow-hidden">
              <div className="h-1 w-full bg-[#F59E0B]" />
              <div className="px-4 py-2 text-[11px] font-black text-[#B45309] flex items-center gap-1.5 border-b border-[#EFE9E0]">
                <BookOpen className="w-3.5 h-3.5" />
                <span>مقالات دانشنامه عسل و کندو</span>
              </div>
              <div className="py-1">
                {MAGAZINE_DROPDOWN_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeAll}
                    className="block px-4 py-2.5 text-xs font-bold text-[#2B2017] hover:bg-[#FAF5EB] hover:text-[#B45309] border-r-2 border-transparent hover:border-[#D97706] transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="px-4 py-2 bg-[#FAF6EE] border-t border-[#EFE9E0]">
                <Link
                  href="/magazine"
                  onClick={closeAll}
                  className="text-[11px] font-black text-[#B45309] hover:underline flex items-center justify-between"
                >
                  <span>مشاهده صفحه اصلی مجله علمی</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {divider}

      {/* 5. سوالات متداول (زیرمنو ۴ پرسش کلیدی) */}
      <div
        className="relative flex items-center"
        onMouseEnter={() => openDropdown('faq')}
        onMouseLeave={scheduleClose}
      >
        <div className="flex items-center gap-0.5">
          <Link
            href="/faq"
            onClick={closeAll}
            className={linkClass(pathname.startsWith('/faq'))}
          >
            سوالات متداول
          </Link>
          <button
            type="button"
            onClick={() => (openMenu === 'faq' ? closeAll() : openDropdown('faq'))}
            aria-label="باز کردن زیرمنوی سوالات متداول"
            aria-expanded={openMenu === 'faq'}
            aria-haspopup="menu"
            className="p-0.5 text-white/95 hover:text-[#FFF6D6] transition-colors cursor-pointer"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-150 ${
                openMenu === 'faq' ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {openMenu === 'faq' && (
          <div
            role="menu"
            className="absolute top-full left-0 pt-2.5 z-50"
            onMouseEnter={() => openDropdown('faq')}
            onMouseLeave={scheduleClose}
          >
            <div className="w-80 bg-[#FFFDF9] border-2 border-[#D9A441] rounded-none shadow-2xl text-[#2B2017] overflow-hidden">
              <div className="h-1 w-full bg-[#F59E0B]" />
              <div className="px-4 py-2 text-[11px] font-black text-[#B45309] flex items-center gap-1.5 border-b border-[#EFE9E0]">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>پرسش‌های پرتکرار عسل طبیعی</span>
              </div>
              <div className="py-1">
                {FAQ_DROPDOWN_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeAll}
                    className="block px-4 py-2.5 text-xs font-bold text-[#2B2017] hover:bg-[#FAF5EB] hover:text-[#B45309] border-r-2 border-transparent hover:border-[#D97706] transition-colors leading-relaxed"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="px-4 py-2 bg-[#FAF6EE] border-t border-[#EFE9E0]">
                <Link
                  href="/faq"
                  onClick={closeAll}
                  className="text-[11px] font-black text-[#B45309] hover:underline flex items-center justify-between"
                >
                  <span>مشاهده همه سوالات متداول</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {divider}

      {/* 6. تماس با ما */}
      <Link
        href="/contact"
        onClick={closeAll}
        className={linkClass(pathname.startsWith('/contact'))}
      >
        تماس با ما
      </Link>

      {divider}

      {/* 7. انتقادات و پیشنهادات */}
      <Link
        href="/feedback"
        onClick={closeAll}
        className={linkClass(pathname.startsWith('/feedback'))}
      >
        انتقادات و پیشنهادات
      </Link>
    </div>
  );
}
