import React from 'react';

/**
 * Responsive <Picture> Component (Phase 3, Task 4)
 * Server-compatible component generating modern HTML5 <picture> tags
 * with srcset/sizes for pre-computed WebP variants.
 *
 * Design choices:
 * - Bypasses next/image's runtime optimizer to prevent double re-encoding,
 *   preserving battery/CPU on low-power VPS instances.
 * - Explicit width/height to guarantee zero Cumulative Layout Shift (CLS = 0).
 * - Priority prop for LCP (Largest Contentful Paint) optimization.
 * - Tiny blurDataUrl placeholder background during load.
 * - Graceful fallback UI when image asset is null or missing.
 */

export interface PictureAsset {
  id?: string;
  storageKey?: string;
  width?: number | null;
  height?: number | null;
  blurDataUrl?: string | null;
  variants?: Record<string, { url: string; width: number; height: number; bytes?: number }> | any;
  alt?: string | null;
}

export interface PictureProps {
  assetId?: string;
  asset?: PictureAsset | null;
  blurDataUrl?: string | null;
  alt?: string;
  sizes?: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  fallbackText?: string;
  width?: number;
  height?: number;
}

export function Picture({
  asset,
  alt,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  className = '',
  imgClassName = '',
  priority = false,
  fallbackText = 'تصویر در دسترس نیست',
  width: customWidth,
  height: customHeight,
}: PictureProps) {
  let variantsObj = asset?.variants;
  if (typeof variantsObj === 'string') {
    try {
      variantsObj = JSON.parse(variantsObj);
    } catch {}
  }

  const rawVariants: Array<{ url: string; width: number; height: number }> =
    variantsObj && typeof variantsObj === 'object' ? Object.values(variantsObj) : [];

  const sortedVariants = rawVariants
    .filter((v) => v && v.url && v.width)
    .sort((a, b) => a.width - b.width);

  const rawKey = asset?.storageKey;
  const keyWithSlash = rawKey
    ? (rawKey.startsWith('/')
        ? rawKey
        : (rawKey.startsWith('uploads/') ? `/${rawKey}` : `/uploads/${rawKey}`))
    : null;
  const directSrc = (asset as any)?.url || keyWithSlash || null;

  // Graceful fallback when asset is missing or has no source
  if (sortedVariants.length === 0 && !directSrc) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#FFFBEB] border border-[#EFE9E0] text-[#5C5248] p-4 text-xs text-center select-none rounded-none ${className}`}
        style={{
          aspectRatio: customWidth && customHeight ? `${customWidth}/${customHeight}` : '4/3',
        }}
        role="img"
        aria-label={alt || fallbackText}
      >
        <svg
          className="w-8 h-8 text-[#D97706]/50 mb-1.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span>{fallbackText}</span>
      </div>
    );
  }

  // Generate srcSet
  const srcSet = sortedVariants
    .map((v) => `${v.url} ${v.width}w`)
    .join(', ');

  // Default src is the largest variant or direct storage path
  const defaultSrc = sortedVariants[sortedVariants.length - 1]?.url || directSrc || '';

  // Dimensions
  const intrinsicWidth = customWidth || asset?.width || sortedVariants[sortedVariants.length - 1]?.width || 800;
  const intrinsicHeight = customHeight || asset?.height || sortedVariants[sortedVariants.length - 1]?.height || 600;

  const resolvedAlt = alt || asset?.alt || 'عسل باباخُرم';

  const blurStyle: React.CSSProperties = asset?.blurDataUrl
    ? {
        backgroundImage: `url("${asset.blurDataUrl}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {};

  const baseImgClass = imgClassName.includes('h-')
    ? 'w-full object-cover transition-opacity duration-300'
    : 'w-full h-auto object-cover transition-opacity duration-300';

  return (
    <picture className={`block relative overflow-hidden rounded-none ${className}`}>
      {srcSet && (
        <source
          type="image/webp"
          srcSet={srcSet}
          sizes={sizes}
        />
      )}
      <img
        src={defaultSrc}
        alt={resolvedAlt}
        width={intrinsicWidth}
        height={intrinsicHeight}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        style={blurStyle}
        className={`${baseImgClass} ${imgClassName}`}
      />
    </picture>
  );
}
