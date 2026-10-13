/**
 * HamburgerDrawer Component (Adaptive: Categories on Desktop, Navigation on Mobile)
 *
 * Requirements:
 * 1. Mobile (< lg):
 *    - Displays ONLY the main header navigation options:
 *      صفحه اصلی | محصولات | دستورها و دسرها | تماس با ما | انتقادات و پیشنهادات | جستجو
 *    - Does NOT display the categories lists on mobile.
 * 2. Desktop (lg:):
 *    - Preserves classic state: displays category sections:
 *      "محصولات ما" (with link to /products and active product categories)
 *      "دسرهای عسل" (with link to /recipes and active recipe categories)
 *    - Header title: "دسته‌بندی‌های عسل باباخُرم"
 * 3. Accessibility & Animation:
 *    - Full RTL support with backdrop, scroll-lock, focus trap, and Escape key handling.
 */

'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  X,
  Home,
  ShoppingBag,
  UtensilsCrossed,
  Phone,
  MessageSquareQuote,
  Search,
  ChevronLeft,
  Sparkles,
  Utensils,
} from 'lucide-react';

export interface CategoryNavItem {
  id: string;
  name: string;
  slug: string;
  type: 'PRODUCT' | 'RECIPE';
}

interface HamburgerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSearch?: () => void;
  productCategories?: CategoryNavItem[];
  recipeCategories?: CategoryNavItem[];
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

export function HamburgerDrawer({
  isOpen,
  onClose,
  onOpenSearch,
  productCategories = [],
  recipeCategories = [],
  triggerRef,
}: HamburgerDrawerProps) {
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Body Scroll Lock & Initial Focus
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Focus Trap & Escape Key Handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        triggerRef?.current?.focus();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  const mobileNavItems = [
    {
      href: '/',
      label: 'صفحه اصلی',
      icon: Home,
      description: 'خانه، معرفی و گزیده محصولات و مقالات',
    },
    {
      href: '/products',
      label: 'محصولات',
      icon: ShoppingBag,
      description: 'انواع عسل‌های طبیعی و خام کوهستان',
    },
    {
      href: '/recipes',
      label: 'دستورها و دسرها',
      icon: UtensilsCrossed,
      description: 'ترکیبات، نوشیدنی‌ها و دسرهای خوش‌طعم',
    },
    {
      href: '/contact',
      label: 'تماس با ما',
      icon: Phone,
      description: 'راه‌های ارتباطی، دفتر مرکزی و نقشه',
    },
    {
      href: '/feedback',
      label: 'انتقادات و پیشنهادات',
      icon: MessageSquareQuote,
      description: 'ثبت نظر، پیگیری و صدای مشتریان',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex justify-start"
      role="dialog"
      aria-modal="true"
      aria-label="منوی سایت"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-out"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container (Right side in RTL) */}
      <div
        ref={drawerRef}
        className="relative w-[85vw] sm:w-[380px] max-w-md h-full bg-[#FDFBF8] text-[#2B2017] shadow-2xl z-10 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 ease-out border-l border-[#EFE9E0] rounded-none"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#EFE9E0] bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-none bg-[#F59E0B] text-white flex items-center justify-center font-black shadow-xs">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L4 6.5V17.5L12 22L20 17.5V6.5L12 2ZM12 4.3L18 7.7V16.3L12 19.7L6 16.3V7.7L12 4.3ZM12 7L8 9.3V14.7L12 17L16 14.7V9.3L12 7Z" />
              </svg>
            </div>
            <span className="font-black text-lg text-[#2B2017]">
              <span className="lg:hidden">منوی اصلی</span>
              <span className="hidden lg:inline">دسته‌بندی‌های عسل باباخُرم</span>
            </span>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => {
              onClose();
              triggerRef?.current?.focus();
            }}
            aria-label="بستن منو"
            className="p-2 text-[#5C5248] hover:text-[#2B2017] hover:bg-stone-100 rounded-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 
          1. Mobile Content View (< lg):
          ONLY the main header navigation options per user requirement.
        */}
        <div className="lg:hidden flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {mobileNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`group flex items-center justify-between p-3.5 sm:p-4 rounded-none border transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#FEF3C7] border-[#F59E0B] text-[#92400E] shadow-sm font-black'
                    : 'bg-white hover:bg-[#FFFBEB] border-[#EFE9E0] hover:border-[#FBBF24] text-[#2B2017]'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-none flex items-center justify-center shrink-0 transition-colors ${
                      isActive
                        ? 'bg-[#F59E0B] text-white'
                        : 'bg-stone-100 text-[#D97706] group-hover:bg-[#FDE68A] group-hover:text-[#92400E]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-black text-base sm:text-lg tracking-tight">
                      {item.label}
                    </span>
                    <span className="text-xs text-[#5C5248] group-hover:text-[#2B2017] truncate font-bold mt-0.5">
                      {item.description}
                    </span>
                  </div>
                </div>

                <ChevronLeft
                  className={`w-5 h-5 shrink-0 transition-transform group-hover:-translate-x-1 ${
                    isActive ? 'text-[#D97706]' : 'text-stone-400 group-hover:text-[#D97706]'
                  }`}
                />
              </Link>
            );
          })}

          {/* Quick Search Button in Mobile Menu */}
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="w-full group flex items-center justify-between p-3.5 sm:p-4 rounded-none border bg-white hover:bg-[#FFFBEB] border-[#EFE9E0] hover:border-[#FBBF24] text-[#2B2017] transition-all duration-200 cursor-pointer text-right"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-none bg-stone-100 text-[#D97706] group-hover:bg-[#FDE68A] group-hover:text-[#92400E] flex items-center justify-center shrink-0 transition-colors">
                  <Search className="w-5 h-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-black text-base sm:text-lg tracking-tight">
                    جستجو در سایت
                  </span>
                  <span className="text-xs text-[#5C5248] font-bold mt-0.5">
                    جستجوی سریع محصولات و دستورها
                  </span>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 shrink-0 text-stone-400 group-hover:text-[#D97706] transition-transform group-hover:-translate-x-1" />
            </button>
          )}

          {/* Mobile Categories Sections per Brief Section 6 */}
          <div className="pt-4 border-t border-[#EFE9E0] space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 pb-1.5 border-b border-[#EFE9E0]">
                <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                <span className="font-black text-sm text-[#2B2017]">دسته‌بندی‌های محصولات</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {productCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={"/products?category=" + cat.slug}
                    onClick={onClose}
                    className="px-3 py-1 bg-white hover:bg-[#FEF3C7] border border-[#EFE9E0] text-xs font-bold text-[#5C5248] hover:text-[#92400E] rounded-none transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 pb-1.5 border-b border-[#EFE9E0]">
                <Utensils className="w-4 h-4 text-[#3F8F3B]" />
                <span className="font-black text-sm text-[#2B2017]">دسته‌بندی‌های دسرهای عسل</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recipeCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={"/recipes?category=" + cat.slug}
                    onClick={onClose}
                    className="px-3 py-1 bg-white hover:bg-[#FEF3C7] border border-[#EFE9E0] text-xs font-bold text-[#5C5248] hover:text-[#92400E] rounded-none transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 
          2. Desktop Content View (lg:):
          Preserves the classic category navigation lists per user requirement.
        */}
        <div className="hidden lg:flex flex-col flex-1 overflow-y-auto p-6 space-y-8">
          {/* Section 1: محصولات ما */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#EFE9E0]">
              <Sparkles className="w-4 h-4 text-[#F59E0B]" />
              <Link
                href="/products"
                onClick={onClose}
                className="font-black text-base text-[#2B2017] hover:text-[#D97706] transition-colors"
              >
                محصولات ما (مشاهده همه)
              </Link>
            </div>
            <ul className="space-y-1.5 pr-2">
              {productCategories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/products?category=${cat.slug}`}
                    onClick={onClose}
                    className="block py-1.5 text-sm font-bold text-[#5C5248] hover:text-[#2B2017] hover:translate-x-[-4px] transition-all"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              {productCategories.length === 0 && (
                <li className="text-xs text-stone-400 py-1 font-bold">دسته‌بندی فعالی وجود ندارد.</li>
              )}
            </ul>
          </div>

          {/* Section 2: دسرهای عسل */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#EFE9E0]">
              <Utensils className="w-4 h-4 text-[#3F8F3B]" />
              <Link
                href="/recipes"
                onClick={onClose}
                className="font-black text-base text-[#2B2017] hover:text-[#3F8F3B] transition-colors"
              >
                دسرهای عسل (مشاهده همه)
              </Link>
            </div>
            <ul className="space-y-1.5 pr-2">
              {recipeCategories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/recipes?category=${cat.slug}`}
                    onClick={onClose}
                    className="block py-1.5 text-sm font-bold text-[#5C5248] hover:text-[#2B2017] hover:translate-x-[-4px] transition-all"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              {recipeCategories.length === 0 && (
                <li className="text-xs text-stone-400 py-1 font-bold">دسته‌بندی فعالی وجود ندارد.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Drawer Footer info */}
        <div className="p-4 border-t border-[#EFE9E0] bg-white text-center text-xs font-bold text-[#5C5248]">
          عسل طبیعی و کوهستانی باباخُرم
        </div>
      </div>
    </div>
  );
}
