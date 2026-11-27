import { describe, it, expect } from 'vitest';
import { resolveNonAdjacentThemes } from '@/lib/card-theme';
import {
  DEFAULT_CARD_PALETTE,
  CURATED_BRAND_PRESETS,
  autoHarmonizeHex,
  deriveContrastPalette,
} from '@/lib/card-palette';

describe('Dynamic Card Palette & Non-Adjacent Coloring', () => {
  it('prevents horizontal adjacent duplicate colors in a single-row / multi-col grid', () => {
    const items = [
      { id: '1', slug: 'honey-1' },
      { id: '2', slug: 'honey-2' },
      { id: '3', slug: 'honey-3' },
      { id: '4', slug: 'honey-4' },
      { id: '5', slug: 'honey-5' },
    ];

    const themes = resolveNonAdjacentThemes(items, { columns: 5 });
    expect(themes).toHaveLength(5);

    for (let i = 1; i < themes.length; i++) {
      expect(themes[i]).not.toBe(themes[i - 1]);
    }
  });

  it('prevents vertical adjacent duplicate colors in a 3-column grid', () => {
    const items = Array.from({ length: 12 }, (_, i) => ({
      id: `item-${i}`,
      slug: `slug-${i}`,
    }));

    const cols = 3;
    const themes = resolveNonAdjacentThemes(items, { columns: cols });
    expect(themes).toHaveLength(12);

    for (let i = 0; i < items.length; i++) {
      if (i % cols !== 0) {
        expect(themes[i]).not.toBe(themes[i - 1]);
      }
      if (i >= cols) {
        expect(themes[i]).not.toBe(themes[i - cols]);
      }
    }
  });

  it('works with custom dynamic palettes provided from SiteSettings', () => {
    const customPalette = [
      { id: 'NAVY', nameFa: 'سرمه‌ای', bgHex: '#1E3A8A', textHex: '#FFF', subtextHex: '#DDD', borderHex: '#172554' },
      { id: 'EMERALD', nameFa: 'زمردی', bgHex: '#047857', textHex: '#FFF', subtextHex: '#DDD', borderHex: '#064E3B' },
      { id: 'ROSE', nameFa: 'رز کهربایی', bgHex: '#BE123C', textHex: '#FFF', subtextHex: '#DDD', borderHex: '#881337' },
    ];

    const items = Array.from({ length: 9 }, (_, i) => ({ id: `p-${i}`, slug: `product-${i}` }));
    const themes = resolveNonAdjacentThemes(items, { columns: 3, palette: customPalette });

    expect(themes).toHaveLength(9);
    for (let i = 0; i < items.length; i++) {
      expect(['NAVY', 'EMERALD', 'ROSE']).toContain(themes[i]);
      if (i % 3 !== 0) {
        expect(themes[i]).not.toBe(themes[i - 1]);
      }
      if (i >= 3) {
        expect(themes[i]).not.toBe(themes[i - 3]);
      }
    }
  });

  it('auto-harmonizes neon colors to natural organic brand spectrum', () => {
    const neonGreen = '#00FF00';
    const harmonized = autoHarmonizeHex(neonGreen);
    expect(harmonized).not.toBe('#00FF00');
    expect(harmonized.startsWith('#')).toBe(true);
  });

  it('derives optimal WCAG contrast text and border for dark vs light backgrounds', () => {
    const darkDerivation = deriveContrastPalette('#1E3A8A', 'DARK', 'تیره');
    expect(darkDerivation.textHex).toBe('#FFFFFF');

    const lightDerivation = deriveContrastPalette('#F5F0E6', 'LIGHT', 'روشن');
    expect(lightDerivation.textHex).toBe('#2B2017');
  });

  it('enforces minimum 3 colors rule in default palette and curated presets', () => {
    expect(DEFAULT_CARD_PALETTE.length).toBeGreaterThanOrEqual(4);
    expect(CURATED_BRAND_PRESETS.length).toBeGreaterThanOrEqual(5);
  });
});
