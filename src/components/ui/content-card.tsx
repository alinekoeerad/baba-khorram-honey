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
import Image from 'next/image';
import { CardTheme, getCardThemeForSlug, getBalancedCardTheme, resolveItemCardTheme } from '@/lib/domain-utils';
import { DottedArrowIcon } from './dotted-arrow-icon';

export interface ContentCardProps {
  title: string;
  subtitle?: string | null;
  href: string;
  imageAsset?: {
    id?: string;
    storageKey?: string;
    url?: string;
    width?: number | null;
    height?: number | null;
    blurDataUrl?: string | null;
    variants?: any;
    alt?: string | null;
  } | null;
  imageUrl?: string | null;
  secondaryImageAsset?: {
    id?: string;
    storageKey?: string;
    url?: string;
    width?: number | null;
    height?: number | null;
    blurDataUrl?: string | null;
    variants?: any;
    alt?: string | null;
  } | null;
  secondaryImageUrl?: string | null;
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
  focalPoint?: string;
}

const THEME_STYLES: Record<
  string,
  {
    bg: string;
    text: string;
    subtext: string;
    badgeBg: string;
    arrowColor: string;
    borderColor: string;
    hex: string;
  }
> = {
  // Uppercase keys
  GREEN: {
    bg: 'bg-[#4CA849]',
    text: 'text-white',
    subtext: 'text-white/90',
    badgeBg: 'bg-black/50 text-white',
    arrowColor: 'text-white',
    borderColor: 'border-[#3D8B3A]',
    hex: '#4CA849',
  },
  ORANGE: {
    bg: 'bg-[#E08B38]',
    text: 'text-white',
    subtext: 'text-white/90',
    badgeBg: 'bg-black/50 text-white',
    arrowColor: 'text-white',
    borderColor: 'border-[#C67325]',
    hex: '#E08B38',
  },
  YELLOW: {
    bg: 'bg-[#F5A623]',
    text: 'text-[#2B2017]',
    subtext: 'text-[#2B2017]/85',
    badgeBg: 'bg-black/40 text-white',
    arrowColor: 'text-[#2B2017]',
    borderColor: 'border-[#D98E16]',
    hex: '#F5A623',
  },
  BURGUNDY: {
    bg: 'bg-[#9E3556]',
    text: 'text-white',
    subtext: 'text-white/90',
    badgeBg: 'bg-black/50 text-white',
    arrowColor: 'text-white',
    borderColor: 'border-[#822944]',
    hex: '#9E3556',
  },
  // Lowercase keys
  green: {
    bg: 'bg-[#4CA849]',
    text: 'text-white',
    subtext: 'text-white/90',
    badgeBg: 'bg-black/50 text-white',
    arrowColor: 'text-white',
    borderColor: 'border-[#3D8B3A]',
    hex: '#4CA849',
  },
  orange: {
    bg: 'bg-[#E08B38]',
    text: 'text-white',
    subtext: 'text-white/90',
    badgeBg: 'bg-black/50 text-white',
    arrowColor: 'text-white',
    borderColor: 'border-[#C67325]',
    hex: '#E08B38',
  },
  yellow: {
    bg: 'bg-[#F5A623]',
    text: 'text-[#2B2017]',
    subtext: 'text-[#2B2017]/85',
    badgeBg: 'bg-black/40 text-white',
    arrowColor: 'text-[#2B2017]',
    borderColor: 'border-[#D98E16]',
    hex: '#F5A623',
  },
  burgundy: {
    bg: 'bg-[#9E3556]',
    text: 'text-white',
    subtext: 'text-white/90',
    badgeBg: 'bg-black/50 text-white',
    arrowColor: 'text-white',
    borderColor: 'border-[#822944]',
    hex: '#9E3556',
  },
};

export function ContentCard({
  title,
  subtitle,
  href,
  imageAsset,
  imageUrl,
  secondaryImageAsset,
  secondaryImageUrl,
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
  focalPoint,
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
  const rawSlug = slug || href.split('/').pop() || '';

  const slugFallback = isProduct
    ? (rawSlug ? `/images/products/${rawSlug}.webp` : '/images/honey-jar.jpg')
    : (rawSlug ? `/uploads/recipes/dessert-${rawSlug}.webp` : '/images/recipe-1.jpg');

  const assetUrl =
    (imageAsset as any)?.url ||
    (imageAsset?.storageKey
      ? (imageAsset.storageKey.startsWith('/')
          ? imageAsset.storageKey
          : `/uploads/${imageAsset.storageKey}`)
      : null);

  const directUrl =
    assetUrl ||
    imageUrl ||
    slugFallback;

  const effectiveAsset = imageAsset
    ? {
        ...imageAsset,
        url: (imageAsset as any).url || directUrl || undefined,
        width: imageAsset.width ?? 800,
        height: imageAsset.height ?? 1067,
      }
    : directUrl
    ? {
        url: directUrl,
        width: 800,
        height: 1067,
        blurDataUrl: null,
        alt: imageAlt || title,
      }
    : null;

  const secDirectUrl =
    secondaryImageUrl ||
    (secondaryImageAsset as any)?.url ||
    (secondaryImageAsset?.storageKey
      ? (secondaryImageAsset.storageKey.startsWith('/')
          ? secondaryImageAsset.storageKey
          : `/uploads/${secondaryImageAsset.storageKey}`)
      : null);

  const effectiveSecondaryAsset = secondaryImageAsset
    ? {
        ...secondaryImageAsset,
        url: (secondaryImageAsset as any).url || secDirectUrl || undefined,
        width: secondaryImageAsset.width ?? 800,
        height: secondaryImageAsset.height ?? 1067,
      }
    : secDirectUrl
    ? {
        url: secDirectUrl,
        width: 800,
        height: 1067,
        blurDataUrl: null,
        alt: imageAlt || title,
      }
    : null;

  // Resolve focal point from props or asset variants
  const rawFocal =
    focalPoint ||
    (imageAsset?.variants as any)?.focalPoint ||
    (imageAsset as any)?.focalPoint ||
    'center';

  const FOCAL_MAP: Record<string, string> = {
    top: 'object-top',
    bottom: 'object-bottom',
    left: 'object-left',
    right: 'object-right',
    center: 'object-center',
  };

  const objectPositionClass = FOCAL_MAP[rawFocal] || (rawFocal.includes('top') ? 'object-top' : rawFocal.includes('bottom') ? 'object-bottom' : 'object-center');

  // Horizontal variant (Mobile-row: Image on visual right in RTL, text on left)
  if (variant === 'horizontal') {
    return (
      <Link
        href={href}
        className={`group block rounded-none border ${currentTheme.borderColor} shadow-[0_3px_12px_rgba(51,33,21,0.18)] hover:shadow-[0_12px_28px_rgba(51,33,21,0.28)] transition-shadow duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] overflow-hidden ${currentTheme.bg} ${className}`}
      >
        <div className="flex flex-row items-center h-28 sm:h-32">
          {/* Image Container - Visual Right in RTL (first in DOM under dir="rtl") */}
          <div className="relative w-28 sm:w-32 h-full shrink-0 overflow-hidden bg-[#FAF8F5] rounded-none">
            {directUrl ? (
              <Image
                src={directUrl}
                alt={imageAlt || title}
                width={effectiveAsset?.width ?? 800}
                height={effectiveAsset?.height ?? 1067}
                unoptimized={true}
                priority={priority}
                className={`w-full h-full object-cover ${objectPositionClass} transform-gpu transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-110 will-change-transform rounded-none`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#FAF8F5] text-xs font-bold text-[#5C3A21] rounded-none">
                <span>عسل باباخُرم</span>
              </div>
            )}

            {/* Optional Secondary Image on Desktop Hover */}
            {secDirectUrl && (
              <div className="hidden sm:block absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] pointer-events-none rounded-none overflow-hidden">
                <Image
                  src={secDirectUrl}
                  alt={imageAlt || title}
                  width={effectiveSecondaryAsset?.width ?? 800}
                  height={effectiveSecondaryAsset?.height ?? 1067}
                  unoptimized={true}
                  className={`w-full h-full object-cover ${objectPositionClass} transform-gpu transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-110 will-change-transform rounded-none`}
                />
              </div>
            )}

            {/* Glassy Overlay on Hover */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-[#1A130E]/80 via-[#1A130E]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] pointer-events-none rounded-none"
              aria-hidden="true"
            />

            {!isAvailable && (
              <div className="absolute top-2 right-2 bg-black/75 text-white text-[10px] font-bold px-2 py-0.5 rounded-none z-10 shadow-xs">
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
            <div className={`text-xs font-black flex items-center justify-between pt-1 border-t border-black/15 mt-1 ${currentTheme.text}`}>
              <span>{linkLabel}</span>
              <DottedArrowIcon
                direction="left"
                className={`w-4 h-4 transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:-translate-x-1.5 ${currentTheme.arrowColor}`}
              />
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Vertical Standard Card (Desktop & Default) -> Aspect 3:4 portrait + Glassy Magnifier Hover
  return (
    <Link
      href={href}
      className={`group flex flex-col rounded-none border ${currentTheme.borderColor} shadow-[0_4px_16px_rgba(51,33,21,0.18)] hover:shadow-[0_16px_36px_rgba(51,33,21,0.28)] transition-shadow duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] overflow-hidden ${currentTheme.bg} ${className}`}
    >
      {/* Image Area - Aspect 3:4 portrait presentation with Glassy Magnifier Hover */}
      <div className="relative w-full aspect-[3/4] overflow-hidden shrink-0 bg-[#FAF8F5] rounded-none">
        {directUrl ? (
          <Image
            src={directUrl}
            alt={imageAlt || title}
            width={effectiveAsset?.width ?? 800}
            height={effectiveAsset?.height ?? 1067}
            unoptimized={true}
            priority={priority}
            className={`w-full h-full object-cover ${objectPositionClass} transform-gpu transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-110 will-change-transform rounded-none`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#FAF8F5] text-sm font-bold text-[#5C3A21] rounded-none">
            <span>عسل باباخُرم</span>
          </div>
        )}

        {/* Optional Secondary Image on Desktop Hover */}
        {secDirectUrl && (
          <div className="hidden sm:block absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] pointer-events-none rounded-none overflow-hidden">
            <Image
              src={secDirectUrl}
              alt={imageAlt || title}
              width={effectiveSecondaryAsset?.width ?? 800}
              height={effectiveSecondaryAsset?.height ?? 1067}
              unoptimized={true}
              className={`w-full h-full object-cover ${objectPositionClass} transform-gpu transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-110 will-change-transform rounded-none`}
            />
          </div>
        )}

        {/* Glassy Overlay on Hover */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#1A130E]/80 via-[#1A130E]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] pointer-events-none rounded-none"
          aria-hidden="true"
        />

        {/* Out of Stock Badge */}
        {!isAvailable && (
          <div className="absolute top-3 right-3 bg-black/75 text-white text-xs font-bold px-2.5 py-1 rounded-none shadow-xs z-10">
            ناموجود
          </div>
        )}
      </div>

      {/* Card Body - Balanced for compact elegant card presentation */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between text-right">
        <div>
          <h3 className={`font-black text-sm sm:text-base leading-snug line-clamp-2 ${currentTheme.text}`}>
            {title}
          </h3>
          {subtitle && (
            <p className={`text-[11px] sm:text-xs mt-1 line-clamp-1 font-bold ${currentTheme.subtext}`}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Card Footer Link Label with signature Dotted Arrow */}
        <div className={`mt-3 pt-2.5 border-t border-black/15 flex items-center justify-between text-xs sm:text-sm font-black ${currentTheme.text}`}>
          <span>{linkLabel}</span>
          <DottedArrowIcon
            direction="left"
            className={`w-4 h-4 transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:-translate-x-1.5 ${currentTheme.arrowColor}`}
          />
        </div>
      </div>
    </Link>
  );
}
