'use client';

/**
 * Admin Login Page (Phase 2, Task 7)
 * Implements:
 * - RTL layout with Vazirmatn typography
 * - Client-side form submission to adminLoginAction
 * - Generic error messaging (no user enumeration)
 * - Reliable window.location.href redirect upon authentication
 * - Dotted arrow icon matching honey.com design
 */

import React, { useState, useTransition } from 'react';
import { uiStringsFa } from '@/content/ui-strings.fa';
import { adminLoginAction } from '@/server/actions/auth-actions';
import { DottedArrowIcon } from '@/components/ui/dotted-arrow-icon';

export default function AdminLoginPage() {
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const result = await adminLoginAction({ email, password });
        if (result.success) {
          setIsSuccess(true);
          // Hard document navigation ensures session cookies are transmitted directly to Next.js RSC
          window.location.href = '/admin';
        } else {
          setErrorMessage(result.error || uiStringsFa.adminAuth.invalidCredentials);
        }
      } catch {
        setErrorMessage('خطایی در برقراری ارتباط با سرور رخ داد. لطفاً مجدداً تلاش نمایید.');
      }
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[#FDFBF8]">
      <div className="w-full max-w-md bg-white border border-[#EFE9E0] p-8 shadow-md rounded-none">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 items-center justify-center rounded-2xl bg-[#FEF3C7] text-[#D97706] mb-4 shadow-xs">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-[#332115]">{uiStringsFa.adminAuth.loginTitle}</h1>
          <p className="text-sm text-[#5C5248] mt-2 font-medium">{uiStringsFa.adminAuth.loginSubtitle}</p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-[#FEF2F2] border-s-4 border-[#9E3556] text-[#9E3556] text-sm leading-relaxed" role="alert">
            {errorMessage}
          </div>
        )}

        {/* Success Alert */}
        {isSuccess && (
          <div className="mb-6 p-4 bg-[#ECFDF5] border-s-4 border-[#059669] text-[#065F46] text-sm leading-relaxed font-bold" role="status">
            ورود موفقیت‌آمیز بود. در حال انتقال به پیشخوان مدیریت...
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-[#332115] mb-1.5">
              {uiStringsFa.adminAuth.emailLabel}
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@honey.ir"
              disabled={isPending || isSuccess}
              className="w-full px-3.5 py-2.5 bg-[#FFFBEB]/40 border border-[#EFE9E0] text-[#2B2017] text-start focus:outline-none focus:border-[#D97706] transition-colors rounded-none disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-bold text-[#332115] mb-1.5">
              {uiStringsFa.adminAuth.passwordLabel}
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isPending || isSuccess}
              className="w-full px-3.5 py-2.5 bg-[#FFFBEB]/40 border border-[#EFE9E0] text-[#2B2017] text-start focus:outline-none focus:border-[#D97706] transition-colors rounded-none disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isPending || isSuccess}
            className="group w-full flex items-center justify-center gap-2 py-3 px-6 bg-[#FBBF24] hover:bg-[#F59E0B] text-[#332115] font-black transition-all disabled:opacity-50 cursor-pointer shadow-xs rounded-none"
          >
            <span>{isSuccess ? 'در حال انتقال...' : isPending ? 'در حال بررسی...' : uiStringsFa.adminAuth.loginButton}</span>
            <DottedArrowIcon direction="left" className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-[#5C5248]/80 border-t border-[#EFE9E0] pt-4 font-medium">
          {uiStringsFa.brand.name} • پنل مدیریت متمرکز
        </div>
      </div>
    </div>
  );
}
