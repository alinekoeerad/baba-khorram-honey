'use client';

import React from 'react';
import { Container } from '@/components/ui/container';
import { PillButton } from '@/components/ui/pill-button';
import { Mountain, Compass, ShieldCheck, Sparkles } from 'lucide-react';

export function ArtisanHeritageShowcase() {
  const pillars = [
    {
      icon: Mountain,
      title: 'ارتفاعات بکر زاگرس و البرز',
      desc: 'استقرار کندوها در ارتفاع بالای ۲۰۰۰ متر به دور از هرگونه سموم شیمیایی کشاورزی، آلودگی‌های شهری و صنایع.',
    },
    {
      icon: Compass,
      title: 'کوچ‌نشینی پایدار سنتی',
      desc: 'همراه با رویش فصلی گل‌های وحشی (گون، آویشن، گشنیز و کنار) با احترام کامل به چرخه زیستی زنبور عسل.',
    },
    {
      icon: ShieldCheck,
      title: 'شهد ۱۰۰٪ خام و گرما‌ندیده',
      desc: 'برداشت سنتی با حفظ تمام آنزیم‌های زنده، گرده گل و مواد معدنی، بدون پاستوریزاسیون یا فرآوری صنعتی.',
    },
  ];

  return (
    <section
      className="relative py-20 sm:py-28 text-white bg-[#23150B] overflow-hidden"
      aria-labelledby="heritage-heading"
    >
      {/* Background with texture & subtle radial glow */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity pointer-events-none"
        style={{ backgroundImage: "url('/images/beekeeping.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#23150B]/90 via-[#23150B]/95 to-[#23150B] pointer-events-none" />

      <Container className="relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B]/30 text-[#FBBF24] text-xs sm:text-sm font-bold">
            <Sparkles className="w-4 h-4 text-[#FBBF24]" />
            <span>اصالت، ریشه در کوهستان دارد</span>
          </div>

          <h2
            id="heritage-heading"
            className="text-3xl sm:text-5xl font-black text-[#FFFBEB] leading-tight tracking-tight drop-shadow-md"
          >
            هنر زنبورداری اصیل و پایدار باباخُرم
          </h2>

          <p className="text-base sm:text-lg text-[#E5D5C5] leading-relaxed font-medium max-w-2xl mx-auto">
            بیش از سه دهه تعهد به استخراج عسل خالص، بدون دستکاری حرارتی و با تکیه بر دانش بومی کوچ در دشت‌های بکر ایران.
          </p>
        </div>

        {/* 3 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="bg-black/40 border border-white/10 p-6 sm:p-8 rounded-none text-right flex flex-col justify-between hover:border-[#F59E0B]/50 transition-colors shadow-xl"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-none bg-[#F59E0B]/20 border border-[#F59E0B]/40 flex items-center justify-center text-[#FBBF24]">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-[#FFFBEB]">
                    {pillar.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#E5D5C5] leading-loose font-medium">
                    {pillar.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="text-center">
          <PillButton variant="gold" size="lg" href="/products">
            مشاهده عسل‌های ییلاقی و کوهستان
          </PillButton>
        </div>
      </Container>
    </section>
  );
}
