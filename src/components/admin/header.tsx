'use client';

/**
 * Admin Header Component (Phase 2, Task 7 & Phase 5)
 * RTL top bar showing active administrator credentials, public site link, and mobile drawer toggle.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, ExternalLink, LogOut, User as UserIcon, Search, ChevronLeft } from 'lucide-react';
import { AdminSidebar } from './sidebar';

interface AdminHeaderProps {
  user: {
    name: string | null;
    email: string;
    role: string;
  };
}

const BREADCRUMB_MAP: Record<string, string> = {
  admin: 'داشبورد',
  products: 'محصولات عسل',
  recipes: 'دستورهای مصرف',
  categories: 'دسته‌بندی‌ها',
  homepage: 'سکشن‌های صفحه اصلی',
  feedbacks: 'انتقادات و پیشنهادات',
  settings: 'تنظیمات و ارتباطات',
  users: 'مدیران سامانه',
  'audit-log': 'گزارش وقایع',
  new: 'جدید',
  edit: 'ویرایش',
};

export function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Generate dynamic breadcrumbs
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = '/' + pathSegments.slice(0, index + 1).join('/');
    const title = BREADCRUMB_MAP[segment] || segment;
    return { href, title };
  });

  const handleLogout = async () => {
    try {
      // Invalidate cookie / session
      document.cookie = 'better-auth.session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      router.push('/admin/login');
      router.refresh();
    } catch {}
  };

  const handleOpenSearch = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-[#EFE9E0] px-4 md:px-8 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-2xs">
        {/* Right Section in RTL: Mobile Menu Toggle & Dynamic Breadcrumbs (ADM-UI-03) */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            aria-label="باز کردن منوی موبایل"
            className="md:hidden p-2 text-[#2B2017] hover:bg-stone-100 rounded-none cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/admin" className="md:hidden flex items-center gap-2">
            <img
              src="/images/header-logo.webp"
              alt="عسل باباخُرم"
              width={36}
              height={36}
              className="w-9 h-9 object-contain"
            />
          </Link>

          {/* Dynamic Breadcrumbs */}
          <nav aria-label="مسیر صفحه" className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-stone-500">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={crumb.href}>
                  {idx > 0 && <ChevronLeft className="w-3.5 h-3.5 text-stone-300" />}
                  {isLast ? (
                    <span className="text-[#C86A00] font-black">{crumb.title}</span>
                  ) : (
                    <Link href={crumb.href} className="hover:text-stone-800 transition-colors">
                      {crumb.title}
                    </Link>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        {/* Left Section in RTL: Search Command Button + User Badge & Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Quick Spotlight Search Button (Ctrl+K) */}
          <button
            type="button"
            onClick={handleOpenSearch}
            className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-600 rounded-none text-xs font-bold transition-colors cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>جستجو...</span>
            <kbd className="px-1.5 py-0.5 bg-white border border-stone-300 text-[10px] font-mono rounded-none text-stone-500">
              Ctrl K
            </kbd>
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FDFBF8] border border-[#EFE9E0] rounded-xl text-xs">
            <UserIcon className="w-4 h-4 text-[#F59E0B]" />
            <div className="flex flex-col text-right">
              <span className="font-bold text-[#2B2017]">{user.name || user.email}</span>
              <span className="text-[10px] text-stone-500 font-mono" dir="ltr">
                {user.email}
              </span>
            </div>
          </div>

          <Link
            href="/"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-[#5C5248] hover:text-[#D97706] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>مشاهده سایت</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            title="خروج از حساب کاربری"
            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer (< 768px) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full bg-[#332115] shadow-2xl z-10 flex flex-col">
            <div className="p-4 flex justify-end">
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="p-2 text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <AdminSidebar onClose={() => setIsMobileOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
