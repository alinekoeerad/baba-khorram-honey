import { describe, it, expect } from 'vitest';
import {
  normalizeSearchText,
  slugify,
  resolveSlugCollision,
  getCardThemeForSlug,
  matchesServingFilter,
  validateAndNormalizeIranianMobile,
} from '@/lib/domain-utils';

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
