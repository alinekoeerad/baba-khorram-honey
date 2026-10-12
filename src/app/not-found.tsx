import React from 'react';
import Link from 'next/link';
import { WoodBackground } from '@/components/ui/wood-background';
import { Container } from '@/components/ui/container';
import { PillButton } from '@/components/ui/pill-button';
import { Compass, Home, ShoppingBag } from 'lucide-react';

export default function NotFound() {
  return (
    <WoodBackground className="min-h-screen py-20 flex items-center justify-center">
      <Container size="narrow" className="text-center space-y-8">
        <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-[#F59E0B]/20 border-2 border-[#F59E0B] flex items-center justify-center text-[#FBBF24] shadow-2xl">
          <Compass className="w-10 h-10 sm:w-12 sm:h-12 animate-pulse" />
        </div>

        <div className="space-y-3">
          <span className="text-sm sm:text-base font-black text-[#FBBF24] tracking-widest uppercase">
            خطای ۴۰۴
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white drop-shadow-md leading-tight">
            صفحه مورد نظر پیدا نشد
          </h1>
          <p className="text-sm sm:text-base text-[#E6DDD4] max-w-md mx-auto leading-relaxed font-medium">
            متأسفانه صفحه‌ای که به دنبال آن بودید یافت نشد یا ممکن است آدرس آن تغییر کرده باشد.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <PillButton variant="gold" size="lg" href="/">
            بازگشت به صفحه اصلی
          </PillButton>
          <PillButton variant="green" size="lg" href="/products">
            مشاهده محصولات عسل
          </PillButton>
        </div>
      </Container>
    </WoodBackground>
  );
}
