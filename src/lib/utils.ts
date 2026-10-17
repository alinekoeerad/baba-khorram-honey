import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Standard utility for merging Tailwind classes with clsx and tailwind-merge.
 * Used across shadcn/ui components and custom Persian UI elements.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export {
  normalizeDigits,
  normalizePersianDigits,
  parseLocalizedNumber,
  parseLocalizedInt,
  toPersianDigits,
} from './domain-utils';

