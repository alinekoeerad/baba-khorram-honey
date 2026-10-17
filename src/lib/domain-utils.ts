/**
 * Domain Utilities (Phase 1)
 * Search normalization, slug generation, card-theme selection,
 * serving-type filter matching, and Iranian mobile number normalization.
 */

import { uiStringsFa } from '@/content/ui-strings.fa';

/**
 * Brief Section 10: Search text normalization rules.
 * - ي -> ی (\u064A -> \u06CC)
 * - ك -> ک (\u0643 -> \u06A9)
 * - ۀ, ة -> ه (\u06C0, \u0629 -> \u0647)
 * - آ, أ, إ, ٱ -> ا (\u0622, \u0623, \u0625, \u0671 -> \u0627)
 * - Arabic / Persian digits to Latin digits (0-9)
 * - Remove Tatweel (ـ / \u0640)
 * - Remove Harakat / diacritics (\u064B-\u065F, \u0670)
 * - ZWNJ (\u200C) to single space
 * - Lowercase Latin characters
 * - Collapse consecutive whitespace to single space & trim
 */
export function normalizeSearchText(text: string | null | undefined): string {
  if (!text) return '';

  let normalized = text;

  // 1. Lowercase Latin characters
  normalized = normalized.toLowerCase();

  // 2. Arabic to Persian letter unification
  normalized = normalized
    .replace(/\u064A/g, '\u06CC') // ي -> ی
    .replace(/\u0643/g, '\u06A9') // ك -> ک
    .replace(/[\u06C0\u0629]/g, '\u0647') // ۀ, ة -> ه
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627'); // آ, أ, إ, ٱ -> ا

  // 3. Persian and Arabic digits to Latin digits
  normalized = normalized
    .replace(/[\u06F0\u0660]/g, '0')
    .replace(/[\u06F1\u0661]/g, '1')
    .replace(/[\u06F2\u0662]/g, '2')
    .replace(/[\u06F3\u0663]/g, '3')
    .replace(/[\u06F4\u0664]/g, '4')
    .replace(/[\u06F5\u0665]/g, '5')
    .replace(/[\u06F6\u0666]/g, '6')
    .replace(/[\u06F7\u0667]/g, '7')
    .replace(/[\u06F8\u0668]/g, '8')
    .replace(/[\u06F9\u0669]/g, '9');

  // 3.5. Map Arabic percent sign U+066A to %
  normalized = normalized.replace(/\u066A/g, '%');

  // 4. Remove Tatweel (Kashida)
  normalized = normalized.replace(/\u0640/g, '');

  // 5. Remove Arabic / Persian diacritics (Harakat / Tashkeel)
  normalized = normalized.replace(/[\u064B-\u065F\u0670]/g, '');

  // 6. Replace ZWNJ (\u200C) with space
  normalized = normalized.replace(/\u200C/g, ' ');

  // 7. Remove Zero-Width Joiner and special formatting controls
  normalized = normalized.replace(/[\u200D\u200E\u200F\uFEFF]/g, '');

  // 8. Collapse whitespace into a single space and trim
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

/**
 * Generates a clean Latin slug matching ^[a-z0-9]+(?:-[a-z0-9]+)*$
 */
export function slugify(text: string): string {
  if (!text) return '';

  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // remove non-latin and non-alphanumeric except hyphen/space
    .replace(/[\s_]+/g, '-')       // convert spaces and underscores to hyphens
    .replace(/-+/g, '-')          // collapse consecutive hyphens
    .replace(/^-+|-+$/g, '');     // trim leading/trailing hyphens
}

/**
 * Resolves slug collisions by appending -2, -3, etc.
 */
export function resolveSlugCollision(
  baseSlug: string,
  existingSlugs: Set<string> | ((slug: string) => boolean)
): string {
  const isTaken = typeof existingSlugs === 'function'
    ? existingSlugs
    : (s: string) => existingSlugs.has(s);

  if (!isTaken(baseSlug)) {
    return baseSlug;
  }

  let counter = 2;
  while (isTaken(`${baseSlug}-${counter}`)) {
    counter++;
  }

  return `${baseSlug}-${counter}`;
}

export type CardTheme = 'GREEN' | 'ORANGE' | 'YELLOW' | 'BURGUNDY';
export type CardThemeType = CardTheme;

/**
 * Brief Section 8: Deterministic card theme picker for AUTO.
 * Computes a stable hash of the slug to cycle through the 4 locked themes.
 */
export function getCardThemeForSlug(slug: string): CardThemeType {
  const themes: CardThemeType[] = ['GREEN', 'ORANGE', 'YELLOW', 'BURGUNDY'];
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash << 5) - hash + slug.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % themes.length;
  return themes[index];
}

/**
 * Deterministic cycling function to prevent adjacent duplicate card themes in lists and carousels.
 */
export function getBalancedCardTheme(index: number, explicitTheme?: string | null): CardThemeType {
  const themes: CardThemeType[] = ['GREEN', 'ORANGE', 'YELLOW', 'BURGUNDY'];
  if (explicitTheme && themes.includes(explicitTheme.toUpperCase() as CardThemeType)) {
    return explicitTheme.toUpperCase() as CardThemeType;
  }
  return themes[Math.abs(index) % themes.length];
}

/**
 * Unified resolver for card theme. Guarantees that an item's card color
 * in carousels, catalog listings, search results, and its breadcrumb on detail pages
 * are 100% consistent and identical.
 */
export function resolveItemCardTheme(item?: {
  cardTheme?: string | null;
  theme?: string | null;
  sortOrder?: number | null;
  slug?: string | null;
  index?: number | null;
} | null): CardThemeType {
  if (!item) return 'GREEN';
  const raw = (item.cardTheme || item.theme || 'AUTO').toUpperCase();
  const validThemes: CardThemeType[] = ['GREEN', 'ORANGE', 'YELLOW', 'BURGUNDY'];
  if (raw !== 'AUTO' && validThemes.includes(raw as CardThemeType)) {
    return raw as CardThemeType;
  }
  const orderIndex =
    typeof item.sortOrder === 'number' && !isNaN(item.sortOrder)
      ? item.sortOrder
      : typeof item.index === 'number' && !isNaN(item.index)
      ? item.index
      : undefined;

  if (orderIndex !== undefined) {
    return getBalancedCardTheme(orderIndex);
  }

  if (item.slug) {
    return getCardThemeForSlug(item.slug);
  }

  return 'GREEN';
}

export type ServingTypeValue = 'HOT' | 'WARM' | 'COLD';

/**
 * Brief Section 8 & 16: Serving filter semantics.
 * - HOT toggle matches recipes whose servingTypes intersect {HOT, WARM}
 * - COLD toggle matches recipes whose servingTypes intersect {COLD, WARM}
 */
export function matchesServingFilter(
  servingTypes: ServingTypeValue[] | null | undefined,
  filter: 'HOT' | 'COLD'
): boolean {
  if (!servingTypes || servingTypes.length === 0) return false;

  if (filter === 'HOT') {
    return servingTypes.includes('HOT') || servingTypes.includes('WARM');
  }

  if (filter === 'COLD') {
    return servingTypes.includes('COLD') || servingTypes.includes('WARM');
  }

  return false;
}

/**
 * Addendum A4: Iranian mobile normalizer and validator.
 * Accepts Persian/Arabic digits, converts to Latin, trims formatting.
 * Validates against 09xxxxxxxxx pattern.
 */
export function validateAndNormalizeIranianMobile(input: string | null | undefined): {
  isValid: boolean;
  normalized: string | null;
  error?: string;
} {
  if (!input || typeof input !== 'string') {
    return {
      isValid: false,
      normalized: null,
      error: uiStringsFa.validation.mobileRequired,
    };
  }

  // 1. Convert Persian/Arabic digits to Latin digits
  let cleaned = input
    .replace(/[\u06F0\u0660]/g, '0')
    .replace(/[\u06F1\u0661]/g, '1')
    .replace(/[\u06F2\u0662]/g, '2')
    .replace(/[\u06F3\u0663]/g, '3')
    .replace(/[\u06F4\u0664]/g, '4')
    .replace(/[\u06F5\u0665]/g, '5')
    .replace(/[\u06F6\u0666]/g, '6')
    .replace(/[\u06F7\u0667]/g, '7')
    .replace(/[\u06F8\u0668]/g, '8')
    .replace(/[\u06F9\u0669]/g, '9');

  // 2. Strip non-digit characters except leading plus
  cleaned = cleaned.replace(/[\s\-\(\)\.]/g, '');

  // 3. Handle country code prefixes
  if (cleaned.startsWith('+98')) {
    cleaned = '0' + cleaned.substring(3);
  } else if (cleaned.startsWith('0098')) {
    cleaned = '0' + cleaned.substring(4);
  } else if (cleaned.startsWith('98') && cleaned.length === 12) {
    cleaned = '0' + cleaned.substring(2);
  } else if (!cleaned.startsWith('0') && cleaned.length === 10 && cleaned.startsWith('9')) {
    cleaned = '0' + cleaned;
  }

  // 4. Validate exact 11-digit Iranian mobile pattern: 09xxxxxxxxx
  const isMatch = /^09\d{9}$/.test(cleaned);

  if (!isMatch) {
    return {
      isValid: false,
      normalized: null,
      error: uiStringsFa.validation.mobileInvalid,
    };
  }

  return {
    isValid: true,
    normalized: cleaned,
  };
}

/**
 * Converts all Persian (۰-۹ / \u06F0-\u06F9) and Arabic-Indic (٠-٩ / \u0660-\u0669) digits
 * to standard ASCII/Latin digits (0-9).
 */
export function normalizeDigits(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return '';
  return String(input)
    .replace(/[\u06F0\u0660]/g, '0')
    .replace(/[\u06F1\u0661]/g, '1')
    .replace(/[\u06F2\u0662]/g, '2')
    .replace(/[\u06F3\u0663]/g, '3')
    .replace(/[\u06F4\u0664]/g, '4')
    .replace(/[\u06F5\u0665]/g, '5')
    .replace(/[\u06F6\u0666]/g, '6')
    .replace(/[\u06F7\u0667]/g, '7')
    .replace(/[\u06F8\u0668]/g, '8')
    .replace(/[\u06F9\u0669]/g, '9');
}

/**
 * Backward compatibility alias for normalizeDigits
 */
export const normalizePersianDigits = normalizeDigits;

/**
 * Normalizes Persian/Arabic digits, strips thousand separators (`,` / `،` / `_` / spaces),
 * converts Persian decimal separator (`٫` / `/`) to `.`, and parses into a clean JavaScript number.
 * Returns NaN if input cannot be parsed.
 */
export function parseLocalizedNumber(input: unknown): number {
  if (input === null || input === undefined || input === '') return NaN;
  if (typeof input === 'number') return Number.isFinite(input) ? input : NaN;

  const str = normalizeDigits(String(input))
    .trim()
    // Strip thousand separators and spacing: English comma, Persian comma (، / \u060C), underscore, spaces
    .replace(/[,\u060C_\s]/g, '')
    // Convert Persian decimal separator (٫ / \u066B) or slash (/) to standard dot (.)
    .replace(/[\u066B\/]/g, '.');

  if (!str) return NaN;
  const num = Number(str);
  return Number.isFinite(num) ? num : NaN;
}

/**
 * Normalizes Persian/Arabic digits and thousand separators, returning an integer.
 * Returns NaN if input cannot be parsed.
 */
export function parseLocalizedInt(input: unknown): number {
  const num = parseLocalizedNumber(input);
  if (Number.isNaN(num)) return NaN;
  return Math.trunc(num);
}

/**
 * Formats a number or numeric string using standard Persian digits (۰-۹).
 * Brief Section 9 constraint: UI-generated numbers must use Persian digits.
 */
export function toPersianDigits(input: number | string | null | undefined): string {
  if (input === null || input === undefined) return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(input).replace(/\d/g, (digit) => persianDigits[Number(digit)]);
}

/**
 * Formats a number or numeric string as Persian currency with 3-digit comma grouping (e.g. ۱،۲۵۰،۰۰۰).
 */
export function formatPriceFa(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return '۰';
  const num = typeof amount === 'number' ? amount : Number(normalizeDigits(String(amount)));
  if (!Number.isFinite(num)) return '۰';
  const formatted = Math.round(num).toLocaleString('fa-IR');
  return toPersianDigits(formatted);
}

export {
  copyTextSync,
  copyTextToClipboard,
  safeRandomUUID,
  getClientOrigin,
  resolveOrderShareUrl,
  isIosDevice,
  buildSmsUri,
} from './clipboard';
