'use client';

import React, { useState } from 'react';
import { Container } from '@/components/ui/container';
import { PillButton } from '@/components/ui/pill-button';
import { Sparkles, Zap, Moon, HeartPulse, ShieldAlert, ArrowLeft } from 'lucide-react';

interface PurposeOption {
  id: string;
  label: string;
  icon: any;
  honeyName: string;
  honeySlug: string;
  description: string;
  tasteProfile: string;
}

const PURPOSES: PurposeOption[] = [
  {
    id: 'immunity',
    label: 'تقویت سیستم ایمنی و درمان سرماخوردگی',
    icon: ShieldAlert,
    honeyName: 'عسل آویشن وحشی البرز',
    honeySlug: 'wild-thyme-honey',
    description: 'سرشار از تیمول و خواص آنتی‌باکتریال قوی، تسکین‌دهنده سرفه، تقویت‌کننده ریه و بهبود عفونت‌های گلو.',
    tasteProfile: 'تند و گیاهی، عطر نافذ آویشن کوهی',
  },
  {
    id: 'digestion',
    label: 'تقویت معده، هضم و آرامش دستگاه گوارش',
    icon: HeartPulse,
    honeyName: 'عسل طبیعی گون کوهستان',
    honeySlug: 'mountain-astragalus-honey',
    description: 'بسیار ملایم با ساکارز کم (زیر ۲٪)، بهبود زخم و رفلاکس معده و تقویت عملکرد کلیه‌ها.',
    tasteProfile: 'شیرینی ملایم و دلنشین، طبع متعادل',
  },
  {
    id: 'energy',
    label: 'انرژی‌بخش، تقویت عضلات و نشاط روزانه',
    icon: Zap,
    honeyName: 'عسل وحشی کنار (سدر) جنوب',
    honeySlug: 'wild-sidr-honey',
    description: 'منبع متراکم آهن، کلسیم و پروتئین گیاهی؛ فوق‌العاده برای ورزشکاران، کودکان و افزایش قوای جسمانی.',
    tasteProfile: 'گرم، غلیظ با عطر خاص شکوفه‌های سدر',
  },
  {
    id: 'relaxation',
    label: 'آرامش اعصاب و بهبود کیفیت خواب شبانه',
    icon: Moon,
    honeyName: 'عسل چهل‌گیاه ییلاقی ارسباران',
    honeySlug: 'multifloral-mountain-honey',
    description: 'حاصل شهد بیش از ۳۰ گونه گیاه دارویی کوهستان؛ کاهنده اضطراب و استرس با تحریک ترشح ملاتونین طبیعی.',
    tasteProfile: 'چندبعدی، معطر و آرام‌بخش',
  },
];

export function HoneyFinder() {
  const [selectedPurposeId, setSelectedPurposeId] = useState(PURPOSES[0].id);

  const selected = PURPOSES.find((p) => p.id === selectedPurposeId) || PURPOSES[0];

  return (
    <section className="py-16 sm:py-24 bg-[#FFFBEB] border-t border-[#EFE9E0]" aria-labelledby="finder-heading">
      <Container>
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B]/35 text-[#C86A00] text-xs sm:text-sm font-bold">
            <Sparkles className="w-4 h-4 text-[#F59E0B]" />
            <span>راهنمای هوشمند انتخاب عسل</span>
          </div>

          <h2
            id="finder-heading"
            className="text-2xl sm:text-4xl font-black text-[#2B2017] leading-tight tracking-tight"
          >
            کدام عسل برای سلامتی شما مناسب‌تر است؟
          </h2>

          <p className="text-sm sm:text-base text-[#5C5248] font-medium max-w-xl mx-auto">
            هدف اصلی خود از مصرف عسل را انتخاب کنید تا تخصصی‌ترین شهد طبیعی را به شما معرفی کنیم.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Options List (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            {PURPOSES.map((purpose) => {
              const Icon = purpose.icon;
              const isSelected = selectedPurposeId === purpose.id;
              return (
                <button
                  key={purpose.id}
                  type="button"
                  onClick={() => setSelectedPurposeId(purpose.id)}
                  className={`w-full p-4 sm:p-5 text-right rounded-none border transition-all flex items-center gap-3.5 cursor-pointer ${
                    isSelected
                      ? 'border-[#F59E0B] bg-white shadow-lg ring-2 ring-[#F59E0B]/30'
                      : 'border-stone-200 bg-white/60 hover:bg-white text-stone-700'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-none flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-[#F59E0B] text-white' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-sm sm:text-base font-bold ${isSelected ? 'text-[#2B2017] font-black' : 'text-stone-700'}`}>
                    {purpose.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Result Card (7 cols) */}
          <div className="lg:col-span-7 bg-white border-2 border-[#F59E0B] p-6 sm:p-8 rounded-none shadow-xl text-right space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <span className="text-xs font-bold text-[#C86A00] uppercase tracking-wider block">
                  عسل پیشنهادی برای شما
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#2B2017] mt-1">
                  {selected.honeyName}
                </h3>
              </div>
              <span className="text-xs font-bold bg-[#FEF3C7] text-[#92400E] px-3 py-1 rounded-full">
                برگه آزمایش تاییدشده
              </span>
            </div>

            <p className="text-sm sm:text-base text-[#4A3B32] font-medium leading-loose">
              {selected.description}
            </p>

            <div className="bg-[#FDFBF8] p-3.5 border border-[#EFE9E0] text-xs sm:text-sm text-[#5C5248]">
              <strong className="text-[#2B2017]">طعم و عطر: </strong>
              <span>{selected.tasteProfile}</span>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <PillButton
                variant="gold"
                size="md"
                href={`/products/${selected.honeySlug}`}
                className="font-black"
              >
                مشاهده مشخصات و خرید
              </PillButton>
              <span className="text-xs text-stone-500 font-medium">
                ارسال رایگان برای سفارش‌های بالای ۱ کیلوگرم
              </span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
