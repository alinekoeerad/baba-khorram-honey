'use client';

/**
 * Admin Header Component (Phase 2, Task 7 & Phase 5)
 * RTL top bar showing active administrator credentials, public site link, and mobile drawer toggle.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, ExternalLink, LogOut, User as UserIcon, Search, ChevronLeft, Bell } from 'lucide-react';
import { AdminSidebar } from './sidebar';
import { getNewOrdersCountAction } from '@/server/actions/order-actions';
import { toPersianDigits } from '@/lib/domain-utils';

interface AdminHeaderProps {
  user: {
    name: string | null;
    email: string;
    role: string;
  };
}

const BREADCRUMB_MAP: Record<string, string> = {
  admin: 'داشبورد',
  orders: 'مدیریت سفارشات',
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
  const [newOrdersCount, setNewOrdersCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    const fetchOrdersCount = async () => {
      try {
        const res = await getNewOrdersCountAction();
        if (isMounted && res.success && typeof res.count === 'number') {
          setNewOrdersCount(res.count);
        }
      } catch {}
    };

    fetchOrdersCount();
    const timer = setInterval(fetchOrdersCount, 15000); // 15-second silent live polling
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [pathname]);

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
      <header className="sticky top-0 z-30 flex h-20 min-h-[5rem] w-full shrink-0 items-center justify-between border-b border-[#E5D5C5] bg-white px-6">
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
              width={160}
              height={160}
              decoding="async"
              className="w-9 h-9 object-contain shrink-0"
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
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Silent Live Order Notification Badge (ADM-ORD-NOTIF) */}
          {newOrdersCount > 0 && (
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 px-3 h-12 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 rounded-none text-xs font-black transition-all cursor-pointer shadow-xs animate-pulse"
              title="سفارش‌های جدید در انتظار هماهنگی"
            >
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-none h-2 w-2 bg-rose-600"></span>
              </span>
              <span>🔔 {toPersianDigits(newOrdersCount)} سفارش جدید در انتظار هماهنگی</span>
            </Link>
          )}

          {/* Quick Spotlight Search Button (Ctrl+K) */}
          <button
            type="button"
            onClick={handleOpenSearch}
            className="hidden sm:inline-flex items-center gap-2 px-3.5 h-12 bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-600 rounded-none text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
            <span>جستجو...</span>
            <kbd className="px-1.5 py-0.5 bg-white border border-stone-300 text-[10px] font-mono rounded-none text-stone-500">
              Ctrl K
            </kbd>
          </button>

          <div className="py-1.5 px-3.5 h-12 flex items-center gap-2.5 border border-[#D5C7B8] bg-[#FAF8F5] rounded-none text-xs shrink-0">
            <UserIcon className="w-4 h-4 text-[#F59E0B] shrink-0" />
            <div className="flex flex-col text-right leading-tight">
              <span className="font-bold text-[#2B2017]">{user.name || (user.email === 'admin@honey.ir' ? 'مدیر کل' : user.email)}</span>
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
            className="p-2 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-none transition-colors cursor-pointer"
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
