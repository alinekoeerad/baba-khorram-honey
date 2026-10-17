import { describe, it, expect } from 'vitest';
import {
  normalizeSearchText,
  slugify,
  resolveSlugCollision,
  getCardThemeForSlug,
  matchesServingFilter,
  validateAndNormalizeIranianMobile,
  normalizeDigits,
  parseLocalizedNumber,
  parseLocalizedInt,
  toPersianDigits,
} from '@/lib/domain-utils';
import { buildChannelUrl } from '@/lib/contact-channels';

describe('normalizeSearchText (Brief Section 10)', () => {
  it('unifies Arabic letters to Persian (ي -> ی, ك -> ک)', () => {
    expect(normalizeSearchText('يك قاشق چای خوری كنجد')).toBe('یک قاشق چای خوری کنجد');
  });

  it('converts Persian and Arabic digits to Latin digits (0-9)', () => {
    expect(normalizeSearchText('عسل ۱۰۰ گرم و ۲۰۰ میلی‌لیتر')).toBe('عسل 100 گرم و 200 میلی لیتر');
    expect(normalizeSearchText('١٢٣٤٥٦٧٨٩٠')).toBe('1234567890');
  });

  it('removes Tatweel (Kashida)', () => {
    expect(normalizeSearchText('عـــــســـــل طــبــیــعــی')).toBe('عسل طبیعی');
  });

  it('removes Harakat and diacritics', () => {
    expect(normalizeSearchText('عَسَلٌ طَبِیعِیٌّ وَ خَالِصٌ')).toBe('عسل طبیعی و خالص');
  });

  it('replaces ZWNJ with space and collapses multiple spaces', () => {
    expect(normalizeSearchText('عسل\u200Cهای    کوهپایه\u200Cای')).toBe('عسل های کوهپایه ای');
  });

  it('lowercases mixed Latin characters', () => {
    expect(normalizeSearchText('Honey SAFFRON 500g')).toBe('honey saffron 500g');
  });

  it('handles complex combined real-world text', () => {
    const raw = '  عَسَلِ سِیاه‌دانه (Nigella Sativa) ۱۰۰٪ طَبِیعِیّ!  ';
    const normalized = normalizeSearchText(raw);
    expect(normalized).toBe('عسل سیاه دانه (nigella sativa) 100% طبیعی!');
  });
});

describe('slugify & resolveSlugCollision', () => {
  it('generates valid Latin slugs', () => {
    expect(slugify('Saffron Honey 500g')).toBe('saffron-honey-500g');
    expect(slugify('Nigella Sativa (Black Seed)')).toBe('nigella-sativa-black-seed');
    expect(slugify('  Greek Mountain Tea with Honey & Lemon  ')).toBe('greek-mountain-tea-with-honey-lemon');
  });

  it('resolves slug collisions with sequential suffix (-2, -3)', () => {
    const existing = new Set(['saffron', 'saffron-2']);
    expect(resolveSlugCollision('saffron', existing)).toBe('saffron-3');
    expect(resolveSlugCollision('honey-pot', existing)).toBe('honey-pot');
  });
});

describe('getCardThemeForSlug (AUTO mode)', () => {
  it('deterministically returns one of the 4 locked themes for a slug', () => {
    const theme1 = getCardThemeForSlug('saffron');
    const theme2 = getCardThemeForSlug('saffron');
    expect(theme1).toBe(theme2);

    const validThemes = ['GREEN', 'ORANGE', 'YELLOW', 'BURGUNDY'];
    expect(validThemes).toContain(theme1);
  });
});

describe('matchesServingFilter (Brief Section 8 & 16)', () => {
  it('matches HOT filter correctly with HOT and WARM', () => {
    expect(matchesServingFilter(['HOT'], 'HOT')).toBe(true);
    expect(matchesServingFilter(['WARM'], 'HOT')).toBe(true);
    expect(matchesServingFilter(['HOT', 'COLD'], 'HOT')).toBe(true);
    expect(matchesServingFilter(['COLD', 'WARM'], 'HOT')).toBe(true);
    expect(matchesServingFilter(['COLD'], 'HOT')).toBe(false);
  });

  it('matches COLD filter correctly with COLD and WARM', () => {
    expect(matchesServingFilter(['COLD'], 'COLD')).toBe(true);
    expect(matchesServingFilter(['WARM'], 'COLD')).toBe(true);
    expect(matchesServingFilter(['HOT', 'COLD'], 'COLD')).toBe(true);
    expect(matchesServingFilter(['COLD', 'WARM'], 'COLD')).toBe(true);
    expect(matchesServingFilter(['HOT'], 'COLD')).toBe(false);
  });
});

describe('validateAndNormalizeIranianMobile (Addendum A4)', () => {
  it('validates and normalizes 09xxxxxxxxx format', () => {
    const res = validateAndNormalizeIranianMobile('09123456789');
    expect(res.isValid).toBe(true);
    expect(res.normalized).toBe('09123456789');
  });

  it('converts Persian/Arabic digits and strips country codes', () => {
    const res1 = validateAndNormalizeIranianMobile('+989123456789');
    expect(res1.isValid).toBe(true);
    expect(res1.normalized).toBe('09123456789');

    const res2 = validateAndNormalizeIranianMobile('۰۰۹۸۹۱۲۳۴۵۶۷۸۹');
    expect(res2.isValid).toBe(true);
    expect(res2.normalized).toBe('09123456789');

    const res3 = validateAndNormalizeIranianMobile('۰۹۱۲-۳۴۵-۶۷۸۹');
    expect(res3.isValid).toBe(true);
    expect(res3.normalized).toBe('09123456789');
  });

  it('rejects invalid mobile numbers with Persian error', () => {
    const res1 = validateAndNormalizeIranianMobile('02188776655'); // Landline
    expect(res1.isValid).toBe(false);
    expect(res1.normalized).toBeNull();
    expect(res1.error).toBeDefined();

    const res2 = validateAndNormalizeIranianMobile('0912'); // Too short
    expect(res2.isValid).toBe(false);

    const res3 = validateAndNormalizeIranianMobile('');
    expect(res3.isValid).toBe(false);
  });
});

describe('normalizeDigits (Universal Persian/Arabic Digit Normalizer)', () => {
  it('converts all Persian digits (۰-۹) to standard ASCII (0-9)', () => {
    expect(normalizeDigits('۰۱۲۳۴۵۶۷۸۹')).toBe('0123456789');
    expect(normalizeDigits('۰۹۱۲۳۴۵۶۷۸۹')).toBe('09123456789');
  });

  it('converts all Arabic-Indic digits (٠-٩) to standard ASCII (0-9)', () => {
    expect(normalizeDigits('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789');
    expect(normalizeDigits('٠٩١٢٣٤٥٦٧٨٩')).toBe('09123456789');
  });

  it('handles mixed strings with letters, symbols, and Persian digits', () => {
    expect(normalizeDigits('عسل طبیعی ۵۰۰ گرمی با قیمت ۴۵۰,۰۰۰ تومان')).toBe('عسل طبیعی 500 گرمی با قیمت 450,000 تومان');
    expect(normalizeDigits('FB-1405-۸۹۰')).toBe('FB-1405-890');
    expect(normalizeDigits('admin1@honey.ir')).toBe('admin1@honey.ir');
    expect(normalizeDigits('admin۱@honey.ir')).toBe('admin1@honey.ir');
  });

  it('safely handles null, undefined, empty string, and numbers', () => {
    expect(normalizeDigits(null)).toBe('');
    expect(normalizeDigits(undefined)).toBe('');
    expect(normalizeDigits('')).toBe('');
    expect(normalizeDigits(12345)).toBe('12345');
  });
});

describe('parseLocalizedNumber & parseLocalizedInt (Canonical Storage & Math Integrity)', () => {
  it('parses Persian/Arabic prices with comma/space separators into exact numbers', () => {
    expect(parseLocalizedNumber('۴۵۰,۰۰۰')).toBe(450000);
    expect(parseLocalizedNumber('۴۵۰،۰۰۰')).toBe(450000);
    expect(parseLocalizedNumber('۴۵۰_۰۰۰')).toBe(450000);
    expect(parseLocalizedNumber('۴۵۰ ۰۰۰')).toBe(450000);
    expect(parseLocalizedNumber('٤٥٠,٠٠٠')).toBe(450000); // Arabic digits
  });

  it('parses map coordinates with Persian digits, dots, slashes, and Persian decimal separators', () => {
    expect(parseLocalizedNumber('۳۵.۸۳۳۹۸۷۸')).toBeCloseTo(35.8339878, 6);
    expect(parseLocalizedNumber('۳۵٫۸۳۳۹۸۷۸')).toBeCloseTo(35.8339878, 6); // Persian decimal separator (٫)
    expect(parseLocalizedNumber('۳۵/۸۳۳۹۸۷۸')).toBeCloseTo(35.8339878, 6); // Slash separator
    expect(parseLocalizedNumber('۵۰.۹۹۱۵۸۴۱')).toBeCloseTo(50.9915841, 6);
  });

  it('parseLocalizedInt truncates decimals and produces integers', () => {
    expect(parseLocalizedInt('۱۲۵۰.۷۵')).toBe(1250);
    expect(parseLocalizedInt('۳')).toBe(3);
    expect(parseLocalizedInt('۳.۹')).toBe(3);
    expect(parseLocalizedInt('۰')).toBe(0);
  });

  it('returns NaN for invalid non-numeric inputs', () => {
    expect(Number.isNaN(parseLocalizedNumber('abc'))).toBe(true);
    expect(Number.isNaN(parseLocalizedNumber(''))).toBe(true);
    expect(Number.isNaN(parseLocalizedNumber(null))).toBe(true);
    expect(Number.isNaN(parseLocalizedNumber(undefined))).toBe(true);
  });

  it('guarantees cart and order total calculations produce exact integer Toman totals (never NaN)', () => {
    const qtyInput = '۳'; // Persian digit
    const priceInput = '۴۵۰,۰۰۰'; // Persian digits + comma

    const qty = parseLocalizedInt(qtyInput);
    const unitPrice = parseLocalizedNumber(priceInput);

    expect(typeof qty).toBe('number');
    expect(typeof unitPrice).toBe('number');
    expect(Number.isFinite(qty)).toBe(true);
    expect(Number.isFinite(unitPrice)).toBe(true);

    const totalToman = qty * unitPrice;
    expect(totalToman).toBe(1350000);
    expect(typeof totalToman).toBe('number');
    expect(Number.isNaN(totalToman)).toBe(false);
  });
});

describe('Safe Contact Deep Links with Persian/Arabic Digits', () => {
  it('generates valid ASCII tel: links from Persian and Arabic phone numbers', () => {
    const persianPhone = '۰۹۳۸۹۱۹۶۰۱۰';
    const arabicPhone = '٠٩٣٨٩١٩٦٠١٠';

    expect(buildChannelUrl('PHONE', persianPhone)).toBe('tel:09389196010');
    expect(buildChannelUrl('PHONE', arabicPhone)).toBe('tel:09389196010');
  });

  it('generates valid ASCII wa.me links from Persian and Arabic numbers', () => {
    const persianWhatsApp = '۹۸۹۳۸۹۱۹۶۰۱۰';
    const arabicWhatsApp = '٩٨٩٣٨٩١٩٦٠١٠';

    expect(buildChannelUrl('WHATSAPP', persianWhatsApp)).toBe('https://wa.me/989389196010');
    expect(buildChannelUrl('WHATSAPP', arabicWhatsApp)).toBe('https://wa.me/989389196010');
  });
});

