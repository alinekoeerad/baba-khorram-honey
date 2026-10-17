'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  Package,
  BookOpen,
  FolderTree,
  Sliders,
  MessageSquareHeart,
  Settings,
  Users,
  Shield,
  Plus,
  ExternalLink,
  X,
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  category: string;
  href: string;
  icon: any;
}

const COMMAND_ITEMS: CommandItem[] = [
  { id: 'dashboard', title: 'داشبورد مدیریت', category: 'بخش‌ها', href: '/admin', icon: LayoutDashboard },
  { id: 'orders', title: 'مدیریت و پیگیری سفارشات', category: 'بخش‌ها', href: '/admin/orders', icon: Package },
  { id: 'products', title: 'مدیریت محصولات عسل', category: 'بخش‌ها', href: '/admin/products', icon: Package },
  { id: 'new-product', title: 'افزودن محصول جدید', category: 'اقدامات سریع', href: '/admin/products/new', icon: Plus },
  { id: 'recipes', title: 'مدیریت دستورهای مصرف و دسرها', category: 'بخش‌ها', href: '/admin/recipes', icon: BookOpen },
  { id: 'new-recipe', title: 'افزودن دستور جدید', category: 'اقدامات سریع', href: '/admin/recipes/new', icon: Plus },
  { id: 'categories', title: 'مدیریت دسته‌بندی‌ها', category: 'بخش‌ها', href: '/admin/categories', icon: FolderTree },
  { id: 'homepage', title: 'مدیریت سکشن‌های صفحه اصلی (CMS)', category: 'بخش‌ها', href: '/admin/homepage', icon: Sliders },
  { id: 'feedbacks', title: 'مشاهده پیام‌ها و بازخوردها', category: 'بخش‌ها', href: '/admin/feedbacks', icon: MessageSquareHeart },
  { id: 'settings', title: 'تنظیمات سایت و شبکه‌های اجتماعی', category: 'بخش‌ها', href: '/admin/settings', icon: Settings },
  { id: 'users', title: 'مدیریت کاربران و دسترسی‌ها', category: 'بخش‌ها', href: '/admin/users', icon: Users },
  { id: 'audit', title: 'گزارش وقایع و حسابرسی (Audit Log)', category: 'بخش‌ها', href: '/admin/audit-log', icon: Shield },
  { id: 'public-site', title: 'مشاهده وب‌سایت عمومی باباخُرم', category: 'لینک‌ها', href: '/', icon: ExternalLink },
];

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  // Listen to Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filtered = COMMAND_ITEMS.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (href: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(href);
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex].href);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-xl bg-white border-2 border-stone-300 rounded-none shadow-2xl overflow-hidden text-right flex flex-col max-h-[75vh]">
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-stone-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-stone-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleListKeyDown}
            placeholder="جستجو در بخش‌ها، محصولات، دستورها... (Ctrl + K)"
            className="flex-1 bg-transparent text-sm sm:text-base font-bold text-stone-800 placeholder-stone-400 focus:outline-none"
            dir="rtl"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] font-mono text-stone-400 border border-stone-200 px-1.5 py-0.5 rounded-none">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs sm:text-sm text-stone-500 font-bold">
              موردی مطابق با جستجوی شما یافت نشد.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.href)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full p-2.5 rounded-none text-right flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#FEF3C7] text-[#92400E] font-black'
                      : 'hover:bg-stone-100 text-stone-700 font-bold'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-[#D97706]' : 'text-stone-400'}`} />
                    <span className="text-xs sm:text-sm">{item.title}</span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-medium">
                    {item.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-2.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500 font-medium">
          <span>برای پیمایش از کلیدهای جهت‌نما و برای انتخاب از Enter استفاده کنید</span>
          <span className="font-mono text-stone-400">Ctrl + K</span>
        </div>
      </div>
    </div>
  );
}
