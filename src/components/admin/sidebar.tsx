/**
 * Admin Sidebar Component (Phase 2, Task 7 & Phase 5)
 * RTL navigation sidebar with brand header, section links, and active state indicators.
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  MessageSquareHeart,
  Package,
  BookOpen,
  FolderTree,
  Sliders,
  Settings,
  Users,
  Shield,
  Image,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import { toPersianDigits } from '@/lib/domain-utils';
import { uiStringsFa } from '@/content/ui-strings.fa';

import { getAdminFeedbacksAction } from '@/server/actions/feedback-actions';
import { getAdminOrdersAction } from '@/server/actions/order-actions';
import { adminLogoutAction } from '@/server/actions/auth-actions';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const BASE_NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: 'داشبورد مدیریت', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'سفارشات ثبت‌شده', icon: ShoppingBag },
  { href: '/admin/products', label: 'محصولات عسل', icon: Package },
  { href: '/admin/recipes', label: 'دستورهای مصرف', icon: BookOpen },
  { href: '/admin/categories', label: 'دسته‌بندی‌ها', icon: FolderTree },
  { href: '/admin/homepage', label: 'سکشن‌های صفحه اصلی', icon: Sliders },
  { href: '/admin/feedbacks', label: 'انتقادات و پیشنهادات', icon: MessageSquareHeart },
  { href: '/admin/settings', label: 'تنظیمات و ارتباطات', icon: Settings },
  { href: '/admin/users', label: 'مدیران سامانه', icon: Users },
  { href: '/admin/audit-log', label: 'گزارش وقایع (Audit)', icon: Shield },
];

export function AdminSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = React.useState<number>(0);
  const [newOrdersCount, setNewOrdersCount] = React.useState<number>(0);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await adminLogoutAction();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      window.location.href = '/admin/login';
    }
  };

  React.useEffect(() => {
    let mounted = true;
    getAdminFeedbacksAction({ status: 'NEW' })
      .then((res) => {
        if (mounted && res.success && typeof res.unreadCount === 'number') {
          setUnreadCount(res.unreadCount);
        }
      })
      .catch(() => {});

    getAdminOrdersAction({ status: 'NEW' })
      .then((res) => {
        if (mounted && res.success && res.counts?.new !== undefined) {
          setNewOrdersCount(res.counts.new);
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [pathname]);

  return (
    <aside className="h-full flex flex-col bg-[#332115] text-[#E8E2D9] border-s border-black/20 select-none">
      {/* Brand Header */}
      <Link href="/admin" onClick={onClose} className="h-16 sm:h-20 flex items-center px-6 border-b border-white/10 gap-3 group">
        <img
          src="/images/header-logo.webp"
          alt="عسل باباخُرم"
          width={160}
          height={160}
          decoding="async"
          className="w-9 h-9 object-contain shrink-0 group-hover:scale-105 transition-transform"
        />
        <div className="flex flex-col">
          <span className="font-black text-base text-white tracking-tight group-hover:text-[#FBBF24] transition-colors">عسل باباخُرم</span>
          <span className="text-[10px] text-[#FBBF24] font-medium tracking-wide">پنل مدیریت یکپارچه</span>
        </div>
      </Link>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5" aria-label="منوی مدیریت">
        {BASE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);

          const isFeedback = item.href === '/admin/feedbacks';
          const isOrders = item.href === '/admin/orders';
          const badgeText =
            isFeedback && unreadCount > 0
              ? toPersianDigits(unreadCount)
              : isOrders && newOrdersCount > 0
              ? toPersianDigits(newOrdersCount)
              : item.badge
              ? toPersianDigits(item.badge)
              : undefined;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-none text-xs font-bold transition-all ${
                isActive
                  ? 'bg-[#FBBF24] text-[#332115] shadow-xs'
                  : 'text-[#E8E2D9]/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#332115]' : 'text-[#FBBF24]'}`} />
                <span>{item.label}</span>
              </div>
              {badgeText && (
                <span className={`text-[10px] px-2 py-0.5 rounded-none font-mono font-black ${
                  isFeedback && unreadCount > 0
                    ? 'bg-rose-500 text-white animate-pulse'
                    : isOrders && newOrdersCount > 0
                    ? 'bg-emerald-500 text-white animate-pulse'
                    : 'bg-white/20 text-white'
                }`}>
                  {badgeText}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Links */}
      <div className="p-4 border-t border-white/10 space-y-2">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3 py-2 rounded-none text-xs font-bold text-white/80 hover:bg-white/10 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-[#FBBF24]" />
            <span>مشاهده وب‌سایت عمومی</span>
          </div>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center justify-between px-3 py-2 rounded-none text-xs font-bold text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 transition-colors cursor-pointer disabled:opacity-50 text-right"
        >
          <div className="flex items-center gap-2">
            <LogOut className={`w-4 h-4 text-rose-400 ${isLoggingOut ? 'animate-spin' : ''}`} />
            <span>خروج از حساب</span>
          </div>
        </button>
      </div>
    </aside>
  );
}
