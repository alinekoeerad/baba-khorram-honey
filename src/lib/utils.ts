import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Standard utility for merging Tailwind classes with clsx and tailwind-merge.
 * Used across shadcn/ui components and custom Persian UI elements.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Serializes JSON-LD safely for inline <script type="application/ld+json">
 * by escaping '<' so embedded strings cannot break out of the script tag.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export {
  normalizeDigits,
  normalizePersianDigits,
  parseLocalizedNumber,
  parseLocalizedInt,
  toPersianDigits,
  formatPriceFa,
} from './domain-utils';

