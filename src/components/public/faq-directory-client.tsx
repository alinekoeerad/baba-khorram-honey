'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  HelpCircle,
  Info,
  Lightbulb,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { Container } from '@/components/ui/container';
import { WoodBackground } from '@/components/ui/wood-background';
import { PillButton } from '@/components/ui/pill-button';
import { normalizeSearchText, toPersianDigits } from '@/lib/domain-utils';
import {
  FAQ_CATEGORIES,
  FAQ_ENTRIES,
  type FaqCategoryId,
  type FaqContentBlock,
  type FaqEntry,
} from '@/content/faq-data';

function renderBlock(block: FaqContentBlock, idx: number) {
  switch (block.type) {
    case 'heading':
      return (
        <h3
          key={idx}
          className="text-sm sm:text-base font-black text-[#3F2A1D] pt-3 first:pt-0 pb-1 border-b border-[#EFE9E0]"
        >
          {block.text}
        </h3>
      );

    case 'paragraph':
      return (
        <p key={idx} className="text-sm sm:text-[15px] text-[#4A3B31] font-medium leading-7 sm:leading-8">
          {block.text}
        </p>
      );

    case 'list':
      return (
        <ul key={idx} className="space-y-2 pr-1">
          {(block.items || []).map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 text-sm sm:text-[15px] text-[#4A3B31] font-medium leading-7"
            >
              <span
                className="w-2 h-2 mt-2.5 shrink-0 rotate-45 bg-[#D97706]"
                aria-hidden="true"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );

    case 'callout': {
      const variant = block.variant || 'info';
      const styles =
        variant === 'warning'
          ? 'bg-[#FEF2F2] border-[#FECACA] text-[#7F1D1D]'
          : variant === 'tip'
            ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#064E3B]'
            : 'bg-[#FFFBEB] border-[#FDE68A] text-[#5C3A21]';
      const Icon =
        variant === 'warning' ? AlertTriangle : variant === 'tip' ? Lightbulb : Info;
      const iconColor =
        variant === 'warning'
          ? 'text-[#DC2626]'
          : variant === 'tip'
            ? 'text-[#059669]'
            : 'text-[#D97706]';

      return (
        <div
          key={idx}
          className={`border rounded-none p-4 sm:p-5 space-y-2.5 ${styles}`}
        >
          <div className="flex items-center gap-2 font-black text-sm">
            <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} />
            <span>{block.title}</span>
          </div>
          {block.text && (
            <p className="text-xs sm:text-sm font-medium leading-7 opacity-95">{block.text}</p>
          )}
          {block.ctaHref && block.ctaLabel && (
            <div className="pt-1">
              <PillButton variant="gold" size="sm" href={block.ctaHref}>
                {block.ctaLabel}
              </PillButton>
            </div>
          )}
        </div>
      );
    }

    default:
      return null;
  }
}

function FaqAccordionCard({
  entry,
  isOpen,
  onToggle,
}: {
  entry: FaqEntry;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <article
      id={entry.id}
      className={`scroll-mt-28 border rounded-none transition-colors duration-200 bg-white shadow-xs ${
        isOpen
          ? 'border-[#D9A441] ring-1 ring-[#D9A441]/30'
          : 'border-[#EFE9E0] hover:border-[#D9A441]/60'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`faq-panel-${entry.id}`}
        className="w-full px-4 sm:px-6 py-4 sm:py-5 text-right flex items-start justify-between gap-4 hover:bg-[#FAF6EE]/60 transition-colors cursor-pointer"
      >
        <div className="flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 text-[11px] font-bold bg-[#FAF5EB] border border-[#D9A441]/35 text-[#B45309] rounded-full">
              {entry.categoryLabel}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-[#2B2017] leading-snug">
            {entry.question}
          </h2>
          {!isOpen && (
            <p className="text-xs sm:text-sm text-[#6B5A4D] font-medium line-clamp-2 leading-relaxed">
              {entry.shortAnswer}
            </p>
          )}
        </div>

        <span
          className={`w-8 h-8 shrink-0 mt-1 flex items-center justify-center border rounded-none transition-colors ${
            isOpen
              ? 'bg-[#F59E0B] border-[#D97706] text-[#2B2017]'
              : 'bg-[#FAF6EE] border-[#EFE9E0] text-[#5C3A21]'
          }`}
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </span>
      </button>

      {isOpen && (
        <div
          id={`faq-panel-${entry.id}`}
          className="px-4 sm:px-6 pb-6 pt-3 border-t border-[#EFE9E0] bg-[#FFFEFA] space-y-4"
        >
          <p className="text-sm sm:text-base font-bold text-[#3F2A1D] bg-[#FAF5EB] border-r-4 border-[#D97706] px-4 py-3 leading-relaxed">
            {entry.shortAnswer}
          </p>

          <div className="space-y-3">{entry.blocks.map(renderBlock)}</div>

          {entry.relatedArticleSlug && entry.relatedArticleLabel && (
            <div className="pt-3 border-t border-[#EFE9E0] flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-bold text-[#6B5A4D] flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#D97706]" />
                مطالعه عمیق‌تر در مجله علمی:
              </span>
              <Link
                href={`/magazine/${entry.relatedArticleSlug}`}
                className="text-xs sm:text-sm font-black text-[#B45309] hover:text-[#78350F] underline underline-offset-4"
              >
                {entry.relatedArticleLabel}
              </Link>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export function FaqDirectoryClient() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | FaqCategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(FAQ_ENTRIES[0]?.id ?? null);

  // Sync URL hash (e.g. /faq#watery or /faq#authenticity) to open and scroll cleanly
  useEffect(() => {
    const syncHash = () => {
      const rawHash = typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : '';
      if (!rawHash) return;
      const target = FAQ_ENTRIES.find((item) => item.id === rawHash);
      if (!target) return;
      setSelectedCategory('all');
      setSearchQuery('');
      setOpenId(target.id);
      requestAnimationFrame(() => {
        const el = document.getElementById(target.id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    };

    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  const filteredEntries = useMemo(() => {
    const normQuery = normalizeSearchText(searchQuery);
    return FAQ_ENTRIES.filter((entry) => {
      if (selectedCategory !== 'all' && entry.category !== selectedCategory) return false;
      if (!normQuery) return true;
      const searchable = normalizeSearchText(
        [
          entry.question,
          entry.shortAnswer,
          entry.categoryLabel,
          ...entry.blocks.flatMap((b) => [b.title || '', b.text || '', ...(b.items || [])]),
        ].join(' ')
      );
      return searchable.includes(normQuery);
    });
  }, [selectedCategory, searchQuery]);

  const handleToggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${id}`);
    }
  };

  return (
    <WoodBackground className="min-h-screen py-10 sm:py-16">
      <Container className="max-w-5xl space-y-8 sm:space-y-10">
        {/* Page Header matching Website Design System */}
        <header className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FAF5EB] border border-[#D9A441]/40 text-[#C58A2A] text-xs font-bold mb-4">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>دانشنامه پرسش و پاسخ عسل طبیعی</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-[#3F2A1D] tracking-tight mb-4">
            سوالات متداول
          </h1>

          {/* Honeycomb Diamond Accent Divider */}
          <div className="flex items-center justify-center gap-3 my-4" aria-hidden="true">
            <span className="h-[1px] w-12 sm:w-20 bg-[#D9A441]/60" />
            <span className="w-2.5 h-2.5 rotate-45 bg-[#D9A441]" />
            <span className="h-[1px] w-12 sm:w-20 bg-[#D9A441]/60" />
          </div>

          <p className="text-sm sm:text-base text-[#5C5248] font-medium leading-relaxed">
            پاسخ‌های علمی، دقیق و بی‌طرفانه به پرسش‌های پرتکرار درباره اصالت، تفاوت عسل طبیعی و تغذیه‌ای، طبع‌شناسی، غلظت، رایحه و نگهداری اصولی عسل.
          </p>
        </header>

        {/* Search & Category Controls */}
        <div className="bg-white border border-[#EFE9E0] rounded-none shadow-xs p-4 sm:p-5 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-[#78716C] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در سوالات متداول (مثلاً: آزمایش، آبکی، طبع، تک‌گیاه، فاسد)..."
              aria-label="جستجو در سوالات متداول"
              className="w-full pr-10 pl-10 py-2.5 bg-[#FAF6EE] border border-[#D9A441]/40 rounded-none text-sm font-bold text-[#2B2017] placeholder:text-[#78716C] focus:outline-none focus:border-[#D97706] focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="پاک کردن جستجو"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#2B2017] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="دسته‌بندی سوالات">
              {FAQ_CATEGORIES.map((cat) => {
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-2 text-xs sm:text-sm font-black rounded-none border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#3F2A1D] text-white border-[#3F2A1D]'
                        : 'bg-[#FAF6EE] text-[#5C3A21] border-[#EFE9E0] hover:border-[#D9A441]'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <span className="text-xs font-bold text-[#6B5A4D]">
              نمایش {toPersianDigits(filteredEntries.length)} از {toPersianDigits(FAQ_ENTRIES.length)} پرسش
            </span>
          </div>
        </div>

        {/* Accordion List */}
        {filteredEntries.length > 0 ? (
          <div className="space-y-4">
            {filteredEntries.map((entry) => (
              <FaqAccordionCard
                key={entry.id}
                entry={entry}
                isOpen={openId === entry.id}
                onToggle={() => handleToggle(entry.id)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-[#EFE9E0] rounded-none p-8 text-center space-y-4">
            <p className="text-base font-black text-[#3F2A1D]">
              پرسشی مطابق عبارت «{searchQuery}» یافت نشد.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="text-sm font-black text-[#D97706] hover:underline cursor-pointer"
            >
              نمایش همه پرسش‌ها
            </button>
          </div>
        )}

        {/* Bottom Cross-Links */}
        <section className="bg-[#FAF5EB] border border-[#D9A441]/40 rounded-none p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-black text-[#B45309]">
              <Sparkles className="w-4 h-4" />
              <span>بیشتر بدانید</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-[#2B2017]">
              پاسخ تخصصی‌تر یا پرسش مستقیم از زنبورستان؟
            </h2>
            <p className="text-xs sm:text-sm font-medium text-[#5C5248] leading-relaxed">
              برای مطالعه مقالات جامع درباره رویال ژل، بره‌موم، گرده گل، رس بستن و طبع‌شناسی وارد مجله علمی شوید یا مستقیماً با ما در تماس باشید.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <PillButton variant="gold" size="md" href="/magazine">
              مجله علمی باباخُرم
            </PillButton>
            <Link
              href="/contact"
              className="px-4 py-2.5 text-xs sm:text-sm font-black bg-white border border-[#D9A441]/50 text-[#3F2A1D] hover:border-[#3F2A1D] rounded-none transition-colors"
            >
              تماس و مشاوره مستقیم
            </Link>
          </div>
        </section>
      </Container>
    </WoodBackground>
  );
}
