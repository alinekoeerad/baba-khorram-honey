/**
 * ContentCard Component (Brief Section 5 & Phase 5, Task 3)
 * Shared card for Products and Recipes.
 *
 * Requirements:
 * - 90-degree sharp corners (rounded-none)
 * - Subtle shadow, border
 * - Hover lifts 6px (-translate-y-1.5) and image scales ~1.08
 * - Image area 240px high on desktop (sm:h-60), responsive
 * - Card themes: green (#4CA849), orange (#E08B38), yellow (#F5A623, dark text), burgundy (#9E3556), and AUTO (hash from slug)
 * - Availability badge if out of stock ("ناموجود")
 * - Link label followed by honey.com signature dotted arrow icon
 * - Horizontal mobile-row variant: image on visual right (in RTL), text on visual left
 */

import React from 'react';
import Link from 'next/link';
import { CardTheme, getCardThemeForSlug, getBalancedCardTheme } from '@/lib/domain-utils';
import { Picture } from './picture';
import { DottedArrowIcon } from './dotted-arrow-icon';

export interface ContentCardProps {
  title: string;
  subtitle?: string | null;
  href: string;
  imageAsset?: {
    id: string;
    width: number;
    height: number;
    blurDataUrl?: string | null;
  } | null;
  imageUrl?: string | null;
  imageAlt?: string;
  theme?: CardTheme | 'AUTO' | string;
  slug?: string;
  isAvailable?: boolean;
  linkLabel?: string;
  variant?: 'vertical' | 'horizontal';
  className?: string;
  priority?: boolean;
  index?: number;
  itemType?: 'product' | 'recipe';
}

const THEME_STYLES: Record<string, { bg: string; text: string; subtext: string; badgeBg: string }> = {
  // Uppercase keys
  GREEN: {
    bg: 'bg-[#4CA849]',
    text: 'text-white',
    subtext: 'text-white/85',
    badgeBg: 'bg-black/40 text-white',
  },
  ORANGE: {
    bg: 'bg-[#E08B38]',
    text: 'text-white',
    subtext: 'text-white/85',
    badgeBg: 'bg-black/40 text-white',
  },
  YELLOW: {
    bg: 'bg-[#F5A623]',
    text: 'text-[#2B2017]',
    subtext: 'text-[#2B2017]/85',
    badgeBg: 'bg-black/30 text-white',
  },
  BURGUNDY: {
    bg: 'bg-[#9E3556]',
    text: 'text-white',
    subtext: 'text-white/85',
    badgeBg: 'bg-black/40 text-white',
  },
  // Lowercase keys
  green: {
    bg: 'bg-[#4CA849]',
    text: 'text-white',
    subtext: 'text-white/85',
    badgeBg: 'bg-black/40 text-white',
  },
  orange: {
    bg: 'bg-[#E08B38]',
    text: 'text-white',
    subtext: 'text-white/85',
    badgeBg: 'bg-black/40 text-white',
  },
  yellow: {
    bg: 'bg-[#F5A623]',
    text: 'text-[#2B2017]',
    subtext: 'text-[#2B2017]/85',
    badgeBg: 'bg-black/30 text-white',
  },
  burgundy: {
    bg: 'bg-[#9E3556]',
    text: 'text-white',
    subtext: 'text-white/85',
    badgeBg: 'bg-black/40 text-white',
  },
};

export function ContentCard({
  title,
  subtitle,
  href,
  imageAsset,
  imageUrl,
  imageAlt = '',
  theme = 'AUTO',
  slug = '',
  isAvailable = true,
  linkLabel = 'مشاهده',
  variant = 'vertical',
  className = '',
  priority = false,
  index,
  itemType,
}: ContentCardProps) {
  // Resolve card theme: supports index-based balanced alternation, AUTO, uppercase, lowercase
  const rawTheme = theme ? String(theme).toUpperCase() : 'AUTO';
  const resolvedTheme: string =
    rawTheme === 'AUTO' || !THEME_STYLES[rawTheme]
      ? (index !== undefined ? getBalancedCardTheme(index) : getCardThemeForSlug(slug || title))
      : rawTheme;

  const currentTheme = THEME_STYLES[resolvedTheme] || THEME_STYLES.GREEN;
  const isProduct = itemType === 'product' || (itemType === undefined && href.startsWith('/products'));

  // Horizontal variant (Mobile-row: Image on visual right in RTL, text on left)
  if (variant === 'horizontal') {
    return (
      <Link
        href={href}
        className={`group block rounded-none border border-[#EFE9E0] shadow-sm hover:shadow-[0_12px_28px_rgba(51,33,21,0.20)] active:scale-[0.99] transition-all duration-300 ease-out hover:-translate-y-1.5 motion-reduce:transform-none overflow-hidden ${currentTheme.bg} ${className}`}
      >
        <div className="flex flex-row items-center h-28 sm:h-32">
          {/* Image Container - Visual Right in RTL (first in DOM under dir="rtl") */}
          <div className="relative w-28 sm:w-32 h-full shrink-0 overflow-hidden">
            {imageAsset ? (
              <Picture
                asset={imageAsset}
                width={imageAsset.width}
                height={imageAsset.height}
                blurDataUrl={imageAsset.blurDataUrl}
                alt={imageAlt || title}
                className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transform-none"
                priority={priority}
              />
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt={imageAlt || title}
                className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transform-none"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#FAF7F2] text-xs font-bold text-[#5C5248]">
                <span>عسل باباخُرم</span>
              </div>
            )}

            {!isAvailable && (
              <div className="absolute top-2 right-2 bg-[#9E3556] text-white text-[10px] font-bold px-2 py-0.5 rounded-none z-10 shadow-xs">
                ناموجود
              </div>
            )}
          </div>

          {/* Content Area - Visual Left in RTL */}
          <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between h-full min-w-0 text-right">
            <div>
              <h3 className={`font-black text-xs sm:text-sm leading-snug line-clamp-2 ${currentTheme.text}`}>
                {title}
              </h3>
              {subtitle && (
                <p className={`text-[11px] sm:text-xs mt-1 truncate font-bold ${currentTheme.subtext}`}>
                  {subtitle}
                </p>
              )}
            </div>

            {/* Link Label with Dotted Arrow */}
            <div className={`text-xs font-black flex items-center justify-between pt-1 border-t border-black/10 mt-1 ${currentTheme.text}`}>
              <span>{linkLabel}</span>
              <DottedArrowIcon
                direction="left"
                className="w-4 h-4 transition-transform group-hover:-translate-x-1.5"
              />
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Vertical Standard Card (Desktop & Default)
  return (
    <Link
      href={href}
      className={`group flex flex-col rounded-none border border-[#EFE9E0] shadow-sm hover:shadow-[0_16px_36px_rgba(51,33,21,0.22)] active:scale-[0.99] transition-all duration-300 ease-out hover:-translate-y-1.5 motion-reduce:transform-none overflow-hidden ${currentTheme.bg} ${className}`}
    >
      {/* Image Area - Aspect 4:3 edge-to-edge photo presentation */}
      <div className="relative w-full aspect-[4/3] sm:h-60 overflow-hidden shrink-0">
        {imageAsset ? (
          <Picture
            asset={imageAsset}
            width={imageAsset.width}
            height={imageAsset.height}
            blurDataUrl={imageAsset.blurDataUrl}
            alt={imageAlt || title}
            className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transform-none"
            priority={priority}
          />
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={imageAlt || title}
            className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transform-none"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#FAF7F2] text-sm font-medium text-[#5C5248]">
            <span>عسل باباخُرم</span>
          </div>
        )}

        {/* Out of Stock Badge */}
        {!isAvailable && (
          <div className="absolute top-3 right-3 bg-[#9E3556] text-white text-xs font-bold px-2.5 py-1 rounded-none shadow-xs z-10">
            ناموجود
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between text-right">
        <div>
          <h3 className={`font-black text-lg sm:text-xl leading-tight line-clamp-2 ${currentTheme.text}`}>
            {title}
          </h3>
          {subtitle && (
            <p className={`text-xs sm:text-sm mt-1.5 line-clamp-1 font-bold ${currentTheme.subtext}`}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Card Footer Link Label with signature Dotted Arrow */}
        <div className={`mt-5 pt-3 border-t border-black/10 flex items-center justify-between text-sm font-black ${currentTheme.text}`}>
          <span>{linkLabel}</span>
          <DottedArrowIcon
            direction="left"
            className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-2"
          />
        </div>
      </div>
    </Link>
  );
}
