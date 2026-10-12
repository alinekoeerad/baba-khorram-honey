/**
 * NewSectionClient Component (Brief Section 7)
 * Step-by-step creation flow: Select visual template -> Fill content form.
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TemplatePicker } from '@/components/admin/homepage/template-picker';
import { SectionForm } from '@/components/admin/homepage/section-form';
import { TemplateDefinition, TEMPLATE_REGISTRY } from '@/server/services/homepage-template-service';
import { ArrowRight, Sparkles, Check } from 'lucide-react';

export function NewSectionClient() {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDefinition>(
    TEMPLATE_REGISTRY['hero-default']
  );

  return (
    <div className="space-y-6 text-right">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl font-black text-[#2B2017] tracking-tight">
            افزودن سکشن جدید به صفحه اصلی
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 font-bold mt-1">
            {step === 1 ? 'مرحله ۱: انتخاب قالب نمایشی سکشن' : 'مرحله ۲: تکمیل محتوا و تنظیمات'}
          </p>
        </div>

        <Link
          href="/admin/homepage"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>انصراف و بازگشت</span>
        </Link>
      </div>

      {/* Step 1: Choose Template */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-xs sm:text-sm text-amber-900 font-bold">
              لطفاً یکی از قالب‌های بصری استاندارد زیر را جهت ایجاد بخش جدید انتخاب کنید:
            </p>
          </div>

          <TemplatePicker
            selectedTemplateId={selectedTemplate.id}
            onSelectTemplate={(tpl) => setSelectedTemplate(tpl)}
          />

          <div className="flex justify-end pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-8 py-3 bg-[#F59E0B] hover:bg-[#D97706] text-white font-black text-sm rounded-xl transition-all shadow-md cursor-pointer"
            >
              <span>مرحله بعد: تنظیم محتوا</span>
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Content Form */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 bg-stone-100 rounded-xl text-xs font-bold text-stone-700">
            <span>
              قالب انتخاب‌شده: <strong className="text-stone-900">{selectedTemplate.name}</strong> ({selectedTemplate.id})
            </span>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-amber-700 hover:underline font-black cursor-pointer"
            >
              تغییر قالب
            </button>
          </div>

          <SectionForm
            isNew={true}
            initialData={{
              internalName: '',
              type: selectedTemplate.sectionType,
              template: selectedTemplate.id,
              status: 'DRAFT',
              background: selectedTemplate.defaultBackground,
              content: {
                title: '',
                images: [{ url: '/images/hero-1.jpg', alt: '' }],
                image: { url: selectedTemplate.thumbnail, alt: '' },
                body: '',
              },
            }}
          />
        </div>
      )}
    </div>
  );
}
