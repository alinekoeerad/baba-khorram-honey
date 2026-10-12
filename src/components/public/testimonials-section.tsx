'use client';

import React, { useState } from 'react';
import { Container } from '@/components/ui/container';
import { Star, CheckCircle, ChevronRight, ChevronLeft, Quote } from 'lucide-react';

interface Review {
  id: string;
  author: string;
  city: string;
  product: string;
  date: string;
  rating: number;
  comment: string;
}

const REVIEWS: Review[] = [
  {
    id: 'rev-1',
    author: 'دکتر محمدرضا صالحی',
    city: 'تهران',
    product: 'عسل طبیعی گون کوهستان',
    date: '۲ هفته پیش',
    rating: 5,
    comment:
      'به عنوان پزشک، قند و ساکارز عسل برایم بسیار اهمیت دارد. برگه آزمایش همراه محصول کاملاً با نتیجه آزمایشگاه مستقل مطابقت داشت (ساکارز زیر ۱.۸٪). عطر و طعم گیاهی آن بی‌نظیر است.',
  },
  {
    id: 'rev-2',
    author: 'سارا امینی',
    city: 'شیراز',
    product: 'عسل وحشی کنار (سدر) جنوب',
    date: '۱ ماه پیش',
    rating: 5,
    comment:
      'غلیظ‌ترین و خوش‌طعم‌ترین عسل کناری که تا به حال خریدم. کف طبیعی و رنگ کهربایی عقیق آن نشان از اصالت کامل دارد. بسته‌بندی محکم و بدون ذره‌ای نشتی رسید.',
  },
  {
    id: 'rev-3',
    author: 'مهندس کاوه خسروی',
    city: 'اصفهان',
    product: 'عسل آویشن وحشی البرز',
    date: '۳ هفته پیش',
    rating: 5,
    comment:
      'برای تسکین سرفه و تقویت ریه بعد از سرماخوردگی تهیه کردم؛ بعد از دو روز مصرف در ترکیب با آب ولرم و لیمو معجزه کرد. باباخُرم واقعاً کیفیت را فدای سود نکرده است.',
  },
  {
    id: 'rev-4',
    author: 'فاطمه نوری',
    city: 'مشهد',
    product: 'عسل چهل‌گیاه ییلاقی ارسباران',
    date: '۵ روز پیش',
    rating: 5,
    comment:
      'رنگ و بافت کرمی عسل واقعاً عالی بود و صبحانه‌های خانوادگی ما را دگرگون کرد. ممنون از تحویل سریع و ضمانت بازگشت وجهی که به خریدار آرامش خاطر می‌دهد.',
  },
];

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prev = () => {
    setCurrentIndex((i) => (i === 0 ? REVIEWS.length - 1 : i - 1));
  };

  const next = () => {
    setCurrentIndex((i) => (i === REVIEWS.length - 1 ? 0 : i + 1));
  };

  const current = REVIEWS[currentIndex];

  return (
    <section className="py-16 sm:py-24 bg-white border-y border-[#EFE9E0]" aria-labelledby="testimonials-heading">
      <Container>
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>نظرات ثبت‌شده خریداران تاییدشده</span>
          </div>

          <h2
            id="testimonials-heading"
            className="text-2xl sm:text-4xl font-black text-[#2B2017] leading-tight tracking-tight"
          >
            تجربه مشتریان از عسل طبیعی باباخُرم
          </h2>

          <p className="text-sm sm:text-base text-[#5C5248] font-medium max-w-xl mx-auto">
            بیش از ۱۰,۰۰۰ خانواده ایرانی روز خود را با شهد پاک و طبیعی کندوهای ما آغاز می‌کنند.
          </p>
        </div>

        {/* Carousel Card */}
        <div className="max-w-3xl mx-auto relative px-4">
          <div className="bg-[#FDFBF8] border-2 border-[#EFE9E0] p-8 sm:p-12 rounded-none shadow-xl relative text-right space-y-6">
            <Quote className="absolute top-6 left-6 w-12 h-12 text-[#F59E0B]/20 pointer-events-none" />

            {/* Rating Stars */}
            <div className="flex items-center gap-1 text-[#F59E0B]">
              {[...Array(current.rating)].map((_, idx) => (
                <Star key={idx} className="w-5 h-5 fill-current" />
              ))}
            </div>

            {/* Comment Body */}
            <p className="text-base sm:text-xl text-[#2B2017] font-medium leading-loose">
              «{current.comment}»
            </p>

            {/* Author info & Verified badge */}
            <div className="pt-4 border-t border-[#EFE9E0] flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-[#2B2017] text-base sm:text-lg">
                    {current.author}
                  </span>
                  <span className="text-xs text-[#5C5248] font-medium">
                    ({current.city})
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    خریدار تاییدشده
                  </span>
                </div>
                <div className="text-xs text-[#C86A00] font-bold mt-1">
                  محصول خریداری‌شده: {current.product}
                </div>
              </div>

              <div className="text-xs text-stone-400 font-medium">
                {current.date}
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              type="button"
              onClick={prev}
              aria-label="نظر قبلی"
              className="w-12 h-12 rounded-none border border-[#EFE9E0] bg-white text-[#332115] hover:bg-[#FBBF24] hover:text-[#2B2017] flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              {REVIEWS.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`اسلاید ${idx + 1}`}
                  className={`h-2 transition-all cursor-pointer ${
                    currentIndex === idx ? 'w-8 bg-[#F59E0B]' : 'w-2 bg-stone-300'
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={next}
              aria-label="نظر بعدی"
              className="w-12 h-12 rounded-none border border-[#EFE9E0] bg-white text-[#332115] hover:bg-[#FBBF24] hover:text-[#2B2017] flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}
