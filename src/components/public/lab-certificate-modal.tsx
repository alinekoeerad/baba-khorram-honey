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
      {/* Purity & Certificate Trust Section: Warm Official Certificate Sheet */}
      <div className="bg-[#FFFBEB] border border-[#F59E0B]/30 p-6 sm:p-7 rounded-none text-right shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#FDE68A] pb-3">
          <div className="flex items-center gap-2 text-[#2B2017] font-black text-sm sm:text-base">
            <Award className="w-5 h-5 text-[#D97706]" />
            <span>گواهی اصالت و برگه آزمایشگاه تخصصی</span>
          </div>
          <span className="text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full">
            ساکارز زیر ۳٪ تضمینی
          </span>
        </div>

        <p className="text-xs sm:text-sm text-[#5C5248] font-medium leading-relaxed">
          تمام محموله‌های عسل باباخُرم پیش از بسته‌بندی، در آزمایشگاه‌های مرجع و معتبر صنایع غذایی از نظر میزان ساکارز، دیاستاز، HMF و نسبت فروکتوز به گلوکز سنجیده می‌شوند.
        </p>

        {/* Lab metric cards on crisp ivory */}
        <div className="grid grid-cols-3 gap-2.5 text-center pt-1">
          <div className="bg-white border border-[#EFE9E0] p-3 rounded-none shadow-xs">
            <div className="text-[11px] text-[#5C5248] font-bold">ساکارز (Sucrose)</div>
            <div className="text-sm sm:text-base font-black text-[#D97706] mt-1">کمتر از ۲.۵٪</div>
            <span className="inline-block mt-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              استاندارد ممتاز
            </span>
          </div>
          <div className="bg-white border border-[#EFE9E0] p-3 rounded-none shadow-xs">
            <div className="text-[11px] text-[#5C5248] font-bold">فعالیت دیاستاز</div>
            <div className="text-sm sm:text-base font-black text-emerald-700 mt-1">مثبت (طبیعی)</div>
            <span className="inline-block mt-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              آنزیم فعال
            </span>
          </div>
          <div className="bg-white border border-[#EFE9E0] p-3 rounded-none shadow-xs">
            <div className="text-[11px] text-[#5C5248] font-bold">میزان HMF</div>
            <div className="text-sm sm:text-base font-black text-[#2B2017] mt-1">زیر ۱۰ mg/kg</div>
            <span className="inline-block mt-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              گرما‌ندیده
            </span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#FDE68A]">
          <div className="flex items-center gap-1.5 text-xs text-[#5C5248] font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>ضمانت بازگشت بی‌قید و شرط کل وجه در صورت مغایرت آزمایشگاهی</span>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-black text-[#D97706] hover:text-[#B45309] underline cursor-pointer shrink-0"
          >
            <FileText className="w-4 h-4" />
            <span>مشاهده تصویر برگه آزمایش</span>
          </button>
        </div>
      </div>

      {/* Modal Dialog */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-2xl bg-[#FAF7F2] border-2 border-[#F59E0B] p-6 sm:p-8 rounded-none shadow-2xl text-right text-[#2B2017] space-y-6">
            <div className="flex items-center justify-between border-b border-[#EFE9E0] pb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-[#2B2017]">
                  برگه آنالیز آزمایشگاهی {productName}
                </h3>
                <p className="text-xs text-[#5C5248] font-medium mt-1">
                  تاییدشده توسط آزمایشگاه تخصصی فرآورده‌های زنبور عسل
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-none border border-[#EFE9E0] bg-white hover:bg-stone-100 flex items-center justify-center text-[#2B2017] cursor-pointer"
                aria-label="بستن"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Test Sheet Certificate Table */}
            <div className="space-y-4 text-xs sm:text-sm">
              <div className="border border-[#EFE9E0] divide-y divide-[#EFE9E0] bg-white shadow-xs">
                <div className="flex justify-between p-3 bg-[#FFFBEB] font-black text-[#2B2017]">
                  <span>نوع آزمون</span>
                  <span>حد استاندارد ملی</span>
                  <span className="text-[#D97706]">نتیجه نمونه باباخُرم</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-[#332115] font-bold">درصد ساکارز (Sucrose)</span>
                  <span className="text-[#786455]">حداکثر ۵٪</span>
                  <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">۲.۱٪ (عالی)</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-[#332115] font-bold">هیدروکسی متیل فورفورال (HMF)</span>
                  <span className="text-[#786455]">حداکثر ۴۰ mg/kg</span>
                  <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">۷.۵ mg/kg (کاملاً خام)</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-[#332115] font-bold">فعالیت آنزیم دیاستاز (DN)</span>
                  <span className="text-[#786455]">حداقل ۸ گوته</span>
                  <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">۱۲.۴ (حرارت‌ندیده)</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-[#332115] font-bold">نسبت فروکتوز به گلوکز (F/G)</span>
                  <span className="text-[#786455]">حداقل ۰.۹</span>
                  <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">۱.۱۸ (طبیعی)</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-[#332115] font-bold">رطوبت نسبی</span>
                  <span className="text-[#786455]">حداکثر ۲۰٪</span>
                  <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">۱۶.۸٪ (غلظت بالا)</span>
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 leading-relaxed">
                <strong className="text-emerald-950 font-black">نتیجه آزمون: </strong>
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
