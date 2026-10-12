'use client';

import React, { useState } from 'react';
import { Container } from '@/components/ui/container';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: 'crystallization',
    question: 'آیا رُس بستن (شکرک زدن) عسل نشانه تقلبی بودن آن است؟',
    answer:
      'خیر، کاملاً برعکس! رس بستن (Crystallization) فرآیندی کاملاً طبیعی و زیستی در عسل‌های خام و حرارت‌ندیده است که نشان‌دهنده حفظ تمام دیاستازها، آنزیم‌ها و گرده‌های طبیعی گل است. عسل‌های صنعتی با حرارت دادن بالا مانع از این اتفاق می‌شوند اما خاصیت درمانی عسل را نابود می‌کنند. برای بازگرداندن عسل به حالت روان، کافی است ظرف آن را در آب گرم کمتر از ۴۰ درجه سانتی‌گراد (بن‌ماری) قرار دهید.',
  },
  {
    id: 'storage',
    question: 'بهترین روش نگهداری عسل طبیعی چیست؟',
    answer:
      'عسل طبیعی نیازی به یخچال ندارد! دمای یخچال فرآیند تبلور و رُس بستن را تسریع می‌کند. بهترین مکان برای نگهداری عسل، محیط خشک، خنک و دور از نور مستقیم خورشید (در دمای اتاق بین ۱۸ تا ۲۵ درجه سانتی‌گراد) و در ظروف شیشه‌ای با درب کاملاً محکم است تا رطوبت محیط را به خود جذب نکند.',
  },
  {
    id: 'raw-vs-commercial',
    question: 'تفاوت عسل خام طبیعی با عسل‌های سوپرمارکتی در چیست؟',
    answer:
      'عسل خام باباخُرم بدون حرارت‌دهی، بدون فیلتراسیون با فشار بالا و مستقیماً از کندو استخراج می‌شود؛ بنابراین پر از آنتی‌اکسیدان، پروپولیس و گرده گل است. در مقابل، عسل‌های تجاری سوپرمارکتی جهت جلوگیری از شکرک زدن و افزایش ماندگاری ظاهری، تا دمای ۷۰ درجه حرارت دیده و تمام خواص دارویی خود را از دست می‌دهند.',
  },
  {
    id: 'diabetes',
    question: 'آیا افراد مبتلا به دیابت می‌توانند از عسل باباخُرم استفاده کنند؟',
    answer:
      'عسل‌های طبیعی باباخُرم (به‌ویژه عسل گون و عسل کُنار) دارای درصد ساکارز کمتر از ۳ درصد و تاییدیه آزمایشگاهی معتبر هستند. با این حال، افراد دیابتی باید تحت نظر پزشک معالج و با کنترل قند خون، به میزان حساب‌شده مصرف نمایند، چرا که قندهای فروکتوز و گلوکز طبیعی نیز نیاز به مدیریت انسولین دارند.',
  },
];

export function FaqSection() {
  const [openId, setOpenId] = useState<string | null>(FAQS[0].id);

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="py-16 sm:py-24 bg-[#FDFBF8]" aria-labelledby="faq-heading">
      <Container size="narrow">
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#C86A00] text-xs sm:text-sm font-bold">
            <HelpCircle className="w-4 h-4 text-[#F59E0B]" />
            <span>پاسخ به ابهامات رایج شما</span>
          </div>

          <h2
            id="faq-heading"
            className="text-2xl sm:text-4xl font-black text-[#2B2017] leading-tight tracking-tight"
          >
            پرسش‌های متداول درباره عسل طبیعی
          </h2>

          <p className="text-sm sm:text-base text-[#5C5248] font-medium max-w-xl mx-auto">
            همه آنچه باید درباره تشخیص اصالت، نگهداری صحیح و مصرف هوشمندانه عسل طبیعی بدانید.
          </p>
        </div>

        {/* Accordion list */}
        <div className="space-y-4">
          {FAQS.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className={`border rounded-none transition-all ${
                  isOpen
                    ? 'border-[#F59E0B] bg-white shadow-md'
                    : 'border-[#EFE9E0] bg-white/70 hover:border-stone-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(faq.id)}
                  aria-expanded={isOpen}
                  className="w-full p-5 sm:p-6 text-right flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                >
                  <span className={`text-base sm:text-lg font-black ${isOpen ? 'text-[#C86A00]' : 'text-[#2B2017]'}`}>
                    {faq.question}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-none border flex items-center justify-center shrink-0 transition-transform duration-300 ${
                      isOpen
                        ? 'border-[#F59E0B] bg-[#FFFBEB] text-[#C86A00] rotate-180'
                        : 'border-[#EFE9E0] text-[#5C5248]'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-6 sm:px-6 pt-1 text-sm sm:text-base text-[#4A3B32] font-medium leading-loose border-t border-stone-100 animate-fadeIn">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
