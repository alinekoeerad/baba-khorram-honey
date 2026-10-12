'use client';

import React, { useEffect } from 'react';
import { WoodBackground } from '@/components/ui/wood-background';
import { Container } from '@/components/ui/container';
import { PillButton } from '@/components/ui/pill-button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <WoodBackground className="min-h-screen py-20 flex items-center justify-center">
      <Container size="narrow" className="text-center space-y-8">
        <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-red-400 shadow-2xl">
          <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>

        <div className="space-y-3">
          <span className="text-sm sm:text-base font-black text-amber-400 tracking-widest uppercase">
            خطای غیرمنتظره
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-white drop-shadow-md leading-tight">
            مشکلی در پردازش درخواست رخ داد
          </h1>
          <p className="text-sm sm:text-base text-[#E6DDD4] max-w-md mx-auto leading-relaxed font-medium">
            متأسفانه هنگام بارگذاری صفحه خطایی رخ داد. می‌توانید دوباره تلاش کنید یا به صفحه اصلی بازگردید.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            type="button"
            onClick={() => reset()}
            className="honey-pill-button group inline-flex items-center justify-center font-bold rounded-full transition-all duration-200 bg-[#FBBF24] text-[#332115] hover:bg-[#F59E0B] px-8 py-3 text-base gap-2.5 shadow-md hover:shadow-lg cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 animate-spin-reverse" />
            <span>تلاش مجدد</span>
          </button>
          <PillButton variant="green" size="lg" href="/">
            بازگشت به صفحه اصلی
          </PillButton>
        </div>
      </Container>
    </WoodBackground>
  );
}
