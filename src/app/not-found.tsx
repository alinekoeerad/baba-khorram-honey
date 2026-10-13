import React from 'react';
import Link from 'next/link';
import { WoodBackground } from '@/components/ui/wood-background';
import { Container } from '@/components/ui/container';
import { PillButton } from '@/components/ui/pill-button';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <WoodBackground className="min-h-screen py-16 sm:py-24 flex items-center justify-center text-[#3F2A1D]">
      <Container size="narrow" className="text-center">
        {/* Warm Ivory Content Card standing out clearly from Whitewashed Wood */}
        <div className="bg-[#FAF6EE] border border-[#DFD3C3] p-8 sm:p-14 shadow-xl rounded-none max-w-xl mx-auto space-y-6">
          {/* Compass Icon */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-[#FAF5EB] border-2 border-[#D9A441] flex items-center justify-center text-[#C58A2A] shadow-md">
            <Compass className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse text-[#C58A2A]" />
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF5EB] border border-[#D9A441]/40 text-[#C58A2A] text-xs font-black shadow-xs">
              <span>خطای ۴۰۴</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-[#3F2A1D] leading-tight tracking-tight">
              صفحه مورد نظر پیدا نشد
            </h1>

            {/* Honeycomb / Diamond Accent Divider */}
            <div className="flex items-center justify-center gap-2 pt-1 pb-1" aria-hidden="true">
              <span className="h-0.5 w-8 sm:w-12 bg-gradient-to-l from-[#D9A441] to-transparent" />
              <span className="w-2 h-2 rotate-45 bg-[#D9A441]" />
              <span className="h-0.5 w-8 sm:w-12 bg-gradient-to-r from-[#D9A441] to-transparent" />
            </div>

            <p className="text-sm sm:text-base text-[#332A24] max-w-md mx-auto leading-relaxed font-semibold">
              متأسفانه صفحهای که به دنبال آن بودید یافت نشد یا ممکن است آدرس آن تغییر کرده باشد.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <PillButton variant="gold" size="md" href="/">
              بازگشت به صفحه اصلی
            </PillButton>
            <PillButton variant="green" size="md" href="/products">
              مشاهده محصولات عسل
            </PillButton>
          </div>
        </div>
      </Container>
    </WoodBackground>
  );
}
