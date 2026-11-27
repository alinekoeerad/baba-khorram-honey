'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, BookOpen } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { PillButton } from '@/components/ui/pill-button';
import { FAQ_ENTRIES } from '@/content/faq-data';

export const FAQS = FAQ_ENTRIES.filter((entry) => entry.featuredOnHome).map((entry) => ({
  id: entry.id,
  question: entry.question,
  answer: entry.shortAnswer,
  categoryLabel: entry.categoryLabel,
}));

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  categoryLabel?: string | null;
}

export interface FaqSectionProps {
  badgeText?: string | null;
  title?: string | null;
  subtitle?: string | null;
  items?: FaqItem[] | null;
}

export function FaqSection({
  badgeText,
  title,
  subtitle,
  items,
}: FaqSectionProps = {}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const displayBadge = badgeText || 'دانشنامه عسل طبیعی';
  const displayTitle = title || 'سوالات متداول مشتریان';
  const displaySubtitle = subtitle || 'پاسخ علمی به پرسش‌های پرتکرار درباره اصالت عسل، طبع و تفاوت انواع عسل طبیعی.';
  const displayItems = (items && items.length > 0) ? items : FAQS;

  return (
    <section
      aria-labelledby="faq-heading"
      className="py-12 sm:py-16 bg-[#FDFBF8] border-t border-[#EFE9E0]"
    >
      <Container className="max-w-4xl">
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF5EB] border border-[#D9A441]/40 text-[#C58A2A] text-xs font-bold mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{displayBadge}</span>
          </div>

          <h2
            id="faq-heading"
            className="text-2xl sm:text-3xl font-black text-[#2B2017] mb-3"
          >
            {displayTitle}
          </h2>

          <div className="flex items-center justify-center gap-3 my-3" aria-hidden="true">
            <span className="h-[1px] w-10 sm:w-16 bg-[#D9A441]/60" />
            <span className="w-2 h-2 rotate-45 bg-[#D9A441]" />
            <span className="h-[1px] w-10 sm:w-16 bg-[#D9A441]/60" />
          </div>

          <p className="text-sm sm:text-base text-[#5C5248] font-medium max-w-xl mx-auto">
            {displaySubtitle}
          </p>
        </div>

        <div className="space-y-3">
          {displayItems.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.id || idx}
                className="bg-white border border-[#EFE9E0] rounded-none shadow-xs overflow-hidden transition-colors hover:border-[#D9A441]/60"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full px-5 sm:px-6 py-4 text-right flex items-center justify-between gap-4 hover:bg-[#FAF6EE]/60 transition-colors cursor-pointer"
                >
                  <span className="font-black text-[#2B2017] text-sm sm:text-base leading-snug">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 text-[#D97706] transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 pt-2 text-[#4A3B31] text-sm sm:text-base font-medium leading-relaxed border-t border-[#EFE9E0] space-y-3 bg-[#FFFEFA]">
                    <p>{faq.answer}</p>
                    <div>
                      <Link
                        href={faq.id ? `/faq#${faq.id}` : '/faq'}
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black text-[#B45309] hover:text-[#78350F] underline underline-offset-4"
                      >
                        مطالعه توضیح علمی کامل
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <PillButton variant="gold" size="md" href="/faq">
            مشاهده همه سوالات متداول ({FAQ_ENTRIES.length} پرسش)
          </PillButton>
          <PillButton variant="green" size="md" href="/magazine">
            ورود به مجله علمی
          </PillButton>
        </div>
      </Container>
    </section>
  );
}
