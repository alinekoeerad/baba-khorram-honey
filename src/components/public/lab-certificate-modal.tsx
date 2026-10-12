'use client';

import React, { useState } from 'react';
import { FileText, ShieldCheck, CheckCircle2, X, Award, ExternalLink } from 'lucide-react';
import { PillButton } from '@/components/ui/pill-button';

interface LabCertificateModalProps {
  productName: string;
}

export function LabCertificateModal({ productName }: LabCertificateModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Purity & Certificate Trust Section */}
      <div className="bg-black/45 border-2 border-[#F59E0B]/60 p-5 sm:p-6 rounded-none text-right shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/15 pb-3">
          <div className="flex items-center gap-2 text-[#FFFBEB] font-black text-sm sm:text-base">
            <Award className="w-5 h-5 text-[#F59E0B]" />
            <span>گواهی اصالت و آزمایشگاه تخصصی</span>
          </div>
          <span className="text-[11px] font-bold bg-[#F59E0B]/20 text-[#FBBF24] border border-[#F59E0B]/40 px-2.5 py-0.5 rounded-full">
            ساکارز زیر ۳٪ تضمینی
          </span>
        </div>

        <p className="text-xs sm:text-sm text-[#E5D5C5] font-medium leading-relaxed">
          تمام محموله‌های عسل باباخُرم پیش از بسته‌بندی، در آزمایشگاه‌های مرجع و معتبر صنایع غذایی از نظر میزان ساکارز، دیاستاز، HMF و نسبت فروکتوز به گلوکز سنجیده می‌شوند.
        </p>

        {/* Lab metric pills */}
        <div className="grid grid-cols-3 gap-2 text-center pt-1">
          <div className="bg-black/40 border border-white/10 p-2 rounded-none">
            <div className="text-[10px] text-[#D4C3B3] font-bold">ساکارز (Sucrose)</div>
            <div className="text-sm font-black text-[#FBBF24] mt-0.5">کمتر از ۲.۵٪</div>
          </div>
          <div className="bg-black/40 border border-white/10 p-2 rounded-none">
            <div className="text-[10px] text-[#D4C3B3] font-bold">فعالیت دیاستاز</div>
            <div className="text-sm font-black text-emerald-400 mt-0.5">مثبت (طبیعی)</div>
          </div>
          <div className="bg-black/40 border border-white/10 p-2 rounded-none">
            <div className="text-[10px] text-[#D4C3B3] font-bold">میزان HMF</div>
            <div className="text-sm font-black text-[#FFFBEB] mt-0.5">زیر ۱۰ mg/kg</div>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[#E5D5C5] font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>ضمانت بازگشت بی‌قید و شرط کل وجه در صورت مغایرت آزمایشگاهی</span>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FBBF24] hover:text-white underline cursor-pointer shrink-0"
          >
            <FileText className="w-4 h-4" />
            <span>مشاهده تصویر برگه آزمایش</span>
          </button>
        </div>
      </div>

      {/* Modal Dialog (Rounded-none per design tokens) */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-2xl bg-[#23150B] border-2 border-[#F59E0B] p-6 sm:p-8 rounded-none shadow-2xl text-right text-white space-y-6">
            <div className="flex items-center justify-between border-b border-white/20 pb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-[#FFFBEB]">
                  برگه آنالیز آزمایشگاهی {productName}
                </h3>
                <p className="text-xs text-[#E5D5C5] font-medium mt-1">
                  تاییدشده توسط آزمایشگاه تخصصی فرآورده‌های زنبور عسل
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-none border border-white/20 bg-black/40 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                aria-label="بستن"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Test Sheet Certificate Table */}
            <div className="space-y-4 text-xs sm:text-sm">
              <div className="border border-white/20 divide-y divide-white/10 bg-black/40">
                <div className="flex justify-between p-3">
                  <span className="font-bold text-[#D4C3B3]">نوع آزمون</span>
                  <span className="font-bold text-[#D4C3B3]">حد استاندارد ملی</span>
                  <span className="font-black text-[#FBBF24]">نتیجه نمونه باباخُرم</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-white">درصد ساکارز (Sucrose)</span>
                  <span className="text-stone-400">حداکثر ۵٪</span>
                  <span className="font-black text-emerald-400">۲.۱٪ (عالی)</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-white">هیدروکسی متیل فورفورال (HMF)</span>
                  <span className="text-stone-400">حداکثر ۴۰ mg/kg</span>
                  <span className="font-black text-emerald-400">۷.۵ mg/kg (کاملاً خام)</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-white">فعالیت آنزیم دیاستاز (DN)</span>
                  <span className="text-stone-400">حداقل ۸ گوته</span>
                  <span className="font-black text-emerald-400">۱۲.۴ (حرارت‌ندیده)</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-white">نسبت فروکتوز به گلوکز (F/G)</span>
                  <span className="text-stone-400">حداقل ۰.۹</span>
                  <span className="font-black text-emerald-400">۱.۱۸ (طبیعی)</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-white">رطوبت نسبی</span>
                  <span className="text-stone-400">حداکثر ۲۰٪</span>
                  <span className="font-black text-emerald-400">۱۶.۸٪ (غلظت بالا)</span>
                </div>
              </div>

              <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/50 text-xs text-[#E5D5C5] leading-relaxed">
                <strong className="text-white">نتیجه آزمون: </strong>
                نمونه کاملاً با مشخصات عسل طبیعی درجه ۱ تطابق داشته و فاقد هرگونه تغذیه مصنوعی با شربت قند یا فرآوری حرارتی است.
              </div>
            </div>

            <div className="text-center pt-2">
              <PillButton variant="gold" size="md" onClick={() => setIsOpen(false)}>
                متوجه شدم و بازگشت به محصول
              </PillButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
