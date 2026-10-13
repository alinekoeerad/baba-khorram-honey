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
import { CardTheme, getCardThemeForSlug, getBalancedCardTheme, resolveItemCardTheme } from '@/lib/domain-utils';
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
  sortOrder?: number;
  itemType?: 'product' | 'recipe';
}

const THEME_STYLES: Record<
  string,
  {
    topBar: string;
    badgeBg: string;
    badgeText: string;
    hoverBorder: string;
    textHover: string;
    hex: string;
  }
> = {
  // Uppercase keys
  GREEN: {
    topBar: 'bg-[#4CA849]',
    badgeBg: 'bg-[#4CA849]',
    badgeText: 'text-white',
    hoverBorder: 'hover:border-[#4CA849]',
    textHover: 'group-hover:text-[#4CA849]',
    hex: '#4CA849',
  },
  ORANGE: {
    topBar: 'bg-[#E08B38]',
    badgeBg: 'bg-[#E08B38]',
    badgeText: 'text-white',
    hoverBorder: 'hover:border-[#E08B38]',
    textHover: 'group-hover:text-[#E08B38]',
    hex: '#E08B38',
  },
  YELLOW: {
    topBar: 'bg-[#D9A441]',
    badgeBg: 'bg-[#D9A441]',
    badgeText: 'text-[#2E1F14]',
    hoverBorder: 'hover:border-[#D9A441]',
    textHover: 'group-hover:text-[#C58A2A]',
    hex: '#D9A441',
  },
  BURGUNDY: {
    topBar: 'bg-[#9E3556]',
    badgeBg: 'bg-[#9E3556]',
    badgeText: 'text-white',
    hoverBorder: 'hover:border-[#9E3556]',
    textHover: 'group-hover:text-[#9E3556]',
    hex: '#9E3556',
  },
  // Lowercase keys
  green: {
    topBar: 'bg-[#4CA849]',
    badgeBg: 'bg-[#4CA849]',
    badgeText: 'text-white',
    hoverBorder: 'hover:border-[#4CA849]',
    textHover: 'group-hover:text-[#4CA849]',
    hex: '#4CA849',
  },
  orange: {
    topBar: 'bg-[#E08B38]',
    badgeBg: 'bg-[#E08B38]',
    badgeText: 'text-white',
    hoverBorder: 'hover:border-[#E08B38]',
    textHover: 'group-hover:text-[#E08B38]',
    hex: '#E08B38',
  },
  yellow: {
    topBar: 'bg-[#D9A441]',
    badgeBg: 'bg-[#D9A441]',
    badgeText: 'text-[#2E1F14]',
    hoverBorder: 'hover:border-[#D9A441]',
    textHover: 'group-hover:text-[#C58A2A]',
    hex: '#D9A441',
  },
  burgundy: {
    topBar: 'bg-[#9E3556]',
    badgeBg: 'bg-[#9E3556]',
    badgeText: 'text-white',
    hoverBorder: 'hover:border-[#9E3556]',
    textHover: 'group-hover:text-[#9E3556]',
    hex: '#9E3556',
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
  sortOrder,
  itemType,
}: ContentCardProps) {
  // Resolve card theme consistently matching detail page breadcrumbs
  const resolvedTheme: string = resolveItemCardTheme({
    cardTheme: theme,
    sortOrder: typeof sortOrder === 'number' ? sortOrder : index,
    slug: slug || title,
    index,
  });

  const currentTheme = THEME_STYLES[resolvedTheme] || THEME_STYLES.GREEN;
  const isProduct = itemType === 'product' || (itemType === undefined && href.startsWith('/products'));

  // Horizontal variant (Mobile-row: Image on visual right in RTL, text on left)
  if (variant === 'horizontal') {
    return (
      <Link
        href={href}
        className={`group block rounded-none border border-[#DFD3C3] shadow-[0_2px_10px_rgba(63,42,29,0.06)] hover:shadow-[0_12px_28px_rgba(63,42,29,0.16)] active:scale-[0.99] transition-all duration-300 ease-out hover:-translate-y-1.5 motion-reduce:transform-none overflow-hidden bg-[#FAF6EE] ${currentTheme.hoverBorder} ${className}`}
      >
        <div className="flex flex-row items-center h-28 sm:h-32 relative">
          {/* 4px Theme Accent Bar on right edge in RTL */}
          <div className={`absolute top-0 bottom-0 right-0 w-1 ${currentTheme.topBar} z-10`} />

          {/* Image Container - Visual Right in RTL (first in DOM under dir="rtl") */}
          <div className="relative w-28 sm:w-32 h-full shrink-0 overflow-hidden bg-[#F2ECE0]">
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
              <div className="w-full h-full flex items-center justify-center bg-[#FAF6EE] text-xs font-bold text-[#5C3A21]">
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
          <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between h-full min-w-0 text-right bg-[#FAF6EE]">
            <div>
              <h3 className="font-black text-xs sm:text-sm leading-snug line-clamp-2 text-[#3F2A1D] group-hover:text-[#5C3A21] transition-colors">
                {title}
              </h3>
              {subtitle && (
                <p className="text-[11px] sm:text-xs mt-1 truncate font-bold text-[#5C3A21]/90">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Link Label with Dotted Arrow */}
            <div className="text-xs font-black flex items-center justify-between pt-1 border-t border-[#DFD3C3] mt-1 text-[#3F2A1D] group-hover:text-[#C58A2A] transition-colors">
              <span>{linkLabel}</span>
              <DottedArrowIcon
                direction="left"
                className="w-4 h-4 transition-transform group-hover:-translate-x-1.5 text-[#C58A2A]"
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
      className={`group flex flex-col rounded-none border border-[#DFD3C3] shadow-[0_4px_16px_rgba(63,42,29,0.08)] hover:shadow-[0_16px_36px_rgba(63,42,29,0.18)] active:scale-[0.99] transition-all duration-300 ease-out hover:-translate-y-1.5 motion-reduce:transform-none overflow-hidden bg-[#FAF6EE] ${currentTheme.hoverBorder} ${className}`}
    >
      {/* 4px Theme Color Accent Top Stripe */}
      <div className={`h-1 w-full ${currentTheme.topBar} shrink-0`} />

      {/* Image Area - Aspect 4:3 presentation */}
      <div className="relative w-full aspect-[4/3] overflow-hidden shrink-0 bg-[#F2ECE0]">
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
          <div className="w-full h-full flex items-center justify-center bg-[#FAF6EE] text-sm font-medium text-[#5C3A21]">
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
      <div className="p-5 flex-1 flex flex-col justify-between text-right bg-[#FAF6EE]">
        <div>
          <h3 className="font-black text-lg sm:text-xl leading-tight line-clamp-2 text-[#3F2A1D] group-hover:text-[#5C3A21] transition-colors">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs sm:text-sm mt-1.5 line-clamp-1 font-bold text-[#5C3A21]/90">
              {subtitle}
            </p>
          )}
        </div>

        {/* Card Footer Link Label with signature Dotted Arrow */}
        <div className="mt-5 pt-3 border-t border-[#DFD3C3] flex items-center justify-between text-sm font-black text-[#3F2A1D] group-hover:text-[#C58A2A] transition-colors">
          <span>{linkLabel}</span>
          <DottedArrowIcon
            direction="left"
            className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-2 text-[#C58A2A]"
          />
        </div>
      </div>
    </Link>
  );
}
