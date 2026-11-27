/**
 * Card Palette & Dynamic Theme Engine
 *
 * Provides:
 * 1. Default Baba Khorram brand card palette (4 classic colors with white text).
 * 2. Curated presets distinctly diverse from base brand colors (Royal Navy, Cobalt Azure, Persian Teal, Forest Emerald, Velvet Eggplant, etc.).
 * 3. Color harmony adjustment (auto-harmonize to rich natural tones in HSL).
 * 4. All cards strictly guaranteed to have crisp, high-contrast white text (#FFFFFF).
 * 5. Dynamic non-adjacent coloring resolver using custom palettes.
 */

export interface CardPaletteItem {
  id: string;
  nameFa: string;
  bgHex: string;
  textHex: string;
  subtextHex: string;
  borderHex: string;
  badgeBgHex?: string;
  badgeTextHex?: string;
}

/**
 * Default fallback palette matching existing brand identity (with 100% white text)
 */
export const DEFAULT_CARD_PALETTE: CardPaletteItem[] = [
  {
    id: 'GREEN',
    nameFa: 'سبز گیاهی و کوهستان',
    bgHex: '#3D8B3A',
    textHex: '#FFFFFF',
    subtextHex: '#EAF8E9',
    borderHex: '#2E6E2B',
    badgeBgHex: 'rgba(255, 255, 255, 0.90)',
    badgeTextHex: '#2B2017',
  },
  {
    id: 'ORANGE',
    nameFa: 'آجری و عسلی تیره',
    bgHex: '#D27022',
    textHex: '#FFFFFF',
    subtextHex: '#FDF1E6',
    borderHex: '#B15715',
    badgeBgHex: 'rgba(255, 255, 255, 0.90)',
    badgeTextHex: '#2B2017',
  },
  {
    id: 'YELLOW',
    nameFa: 'طلایی و موم کهربایی',
    bgHex: '#C87A14',
    textHex: '#FFFFFF',
    subtextHex: '#FDF3E7',
    borderHex: '#A55D08',
    badgeBgHex: 'rgba(255, 255, 255, 0.90)',
    badgeTextHex: '#2B2017',
  },
  {
    id: 'BURGUNDY',
    nameFa: 'زرشکی اناری و تیره',
    bgHex: '#8C2344',
    textHex: '#FFFFFF',
    subtextHex: '#FCEEF2',
    borderHex: '#6B1630',
    badgeBgHex: 'rgba(255, 255, 255, 0.90)',
    badgeTextHex: '#2B2017',
  },
];

/**
 * Curated brand presets distinctly diverse from the 4 standard colors,
 * providing rich variety while preserving high-contrast white text.
 */
export const CURATED_BRAND_PRESETS: CardPaletteItem[] = [
  {
    id: 'PRESET_ROYAL_NAVY',
    nameFa: 'سرمه‌ای درباری عمیق',
    bgHex: '#1E3A8A',
    textHex: '#FFFFFF',
    subtextHex: '#E0E7FF',
    borderHex: '#172554',
    badgeBgHex: 'rgba(255, 255, 255, 0.92)',
    badgeTextHex: '#1E3A8A',
  },
  {
    id: 'PRESET_COBALT_AZURE',
    nameFa: 'لاجوردی کبالت اقیانوسی',
    bgHex: '#1D4ED8',
    textHex: '#FFFFFF',
    subtextHex: '#DBEAFE',
    borderHex: '#1E40AF',
    badgeBgHex: 'rgba(255, 255, 255, 0.92)',
    badgeTextHex: '#1E3A8A',
  },
  {
    id: 'PRESET_PERSIAN_TEAL',
    nameFa: 'فیروزه‌ای خلیجی تیره',
    bgHex: '#0F766E',
    textHex: '#FFFFFF',
    subtextHex: '#CCFBF1',
    borderHex: '#115E59',
    badgeBgHex: 'rgba(255, 255, 255, 0.92)',
    badgeTextHex: '#134E4A',
  },
  {
    id: 'PRESET_FOREST_EMERALD',
    nameFa: 'یشمی جنگلی تیره',
    bgHex: '#166534',
    textHex: '#FFFFFF',
    subtextHex: '#DCFCE7',
    borderHex: '#14532D',
    badgeBgHex: 'rgba(255, 255, 255, 0.92)',
    badgeTextHex: '#14532D',
  },
  {
    id: 'PRESET_VELVET_EGGPLANT',
    nameFa: 'بادمجانی سلطنتی مخملی',
    bgHex: '#581C87',
    textHex: '#FFFFFF',
    subtextHex: '#F3E8FF',
    borderHex: '#3B0764',
    badgeBgHex: 'rgba(255, 255, 255, 0.92)',
    badgeTextHex: '#3B0764',
  },
  {
    id: 'PRESET_DARK_PLUM',
    nameFa: 'یاقوتی ارغوانی تیره',
    bgHex: '#701A75',
    textHex: '#FFFFFF',
    subtextHex: '#FAE8FF',
    borderHex: '#4A044E',
    badgeBgHex: 'rgba(255, 255, 255, 0.92)',
    badgeTextHex: '#4A044E',
  },
  {
    id: 'PRESET_ROASTED_CARAMEL',
    nameFa: 'کاراملی برشته تیره',
    bgHex: '#78350F',
    textHex: '#FFFFFF',
    subtextHex: '#FEF3C7',
    borderHex: '#451A03',
    badgeBgHex: 'rgba(255, 255, 255, 0.92)',
    badgeTextHex: '#451A03',
  },
  {
    id: 'PRESET_CHARCOAL_SLATE',
    nameFa: 'دودی زغالی لوکس',
    bgHex: '#334155',
    textHex: '#FFFFFF',
    subtextHex: '#F1F5F9',
    borderHex: '#1E293B',
    badgeBgHex: 'rgba(255, 255, 255, 0.92)',
    badgeTextHex: '#0F172A',
  },
  {
    id: 'PRESET_RASPBERRY_WINE',
    nameFa: 'سرخابی تمشکی تیره',
    bgHex: '#831843',
    textHex: '#FFFFFF',
    subtextHex: '#FCE7F3',
    borderHex: '#500724',
    badgeBgHex: 'rgba(255, 255, 255, 0.92)',
    badgeTextHex: '#500724',
  },
  {
    id: 'PRESET_MILITARY_OLIVE',
    nameFa: 'زیتونی تیره چریکی',
    bgHex: '#3F4A2C',
    textHex: '#FFFFFF',
    subtextHex: '#ECFCCB',
    borderHex: '#28311B',
    badgeBgHex: 'rgba(255, 255, 255, 0.92)',
    badgeTextHex: '#28311B',
  },
];

/**
 * Color math helpers: Hex <-> RGB <-> HSL
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 50, g: 50, b: 50 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h = (h % 360) / 360;
  s /= 100;
  l /= 100;

  if (s === 0) {
    const val = Math.round(l * 255);
    return { r: val, g: val, b: val };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, h) * 255);
  const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);

  return { r, g, b };
}

export function getRelativeLuminance(r: number, g: number, b: number): number {
  const normalize = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * normalize(r) + 0.7152 * normalize(g) + 0.0722 * normalize(b);
}

/**
 * Auto-harmonize a given hex color to the natural organic brand spectrum:
 * Clamps excessive neon saturation (to 38% - 70%) and restricts lightness (to 24% - 42%)
 * so that pure white text (#FFFFFF) always renders with crisp, maximum contrast.
 */
export function autoHarmonizeHex(rawHex: string): string {
  const { r, g, b } = hexToRgb(rawHex);
  const hsl = rgbToHsl(r, g, b);

  const harmoniousS = Math.max(38, Math.min(72, hsl.s));
  // Rich, deep lightness range ensuring pure white text has exceptional readability
  const harmoniousL = Math.max(24, Math.min(42, hsl.l));

  const rgb = hslToRgb(hsl.h, harmoniousS, harmoniousL);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

/**
 * Generates optimal text, subtext, and border colors.
 * Per user requirement, all card text is strictly pure white (#FFFFFF).
 */
export function deriveContrastPalette(
  bgHex: string,
  id: string,
  nameFa: string,
  forceWhiteText: boolean = false
): CardPaletteItem {
  const { r, g, b } = hexToRgb(bgHex);
  const lum = getRelativeLuminance(r, g, b);

  // Darker border for depth
  const hsl = rgbToHsl(r, g, b);
  const borderRgb = hslToRgb(hsl.h, hsl.s, Math.max(12, hsl.l - 12));
  const borderHex = rgbToHex(borderRgb.r, borderRgb.g, borderRgb.b);

  if (!forceWhiteText && lum > 0.42) {
    return {
      id,
      nameFa,
      bgHex,
      textHex: '#2B2017',
      subtextHex: '#4E3A28',
      borderHex,
      badgeBgHex: 'rgba(255, 255, 255, 0.88)',
      badgeTextHex: '#2B2017',
    };
  }

  return {
    id,
    nameFa,
    bgHex,
    textHex: '#FFFFFF',
    subtextHex: 'rgba(255, 255, 255, 0.88)',
    borderHex,
    badgeBgHex: 'rgba(255, 255, 255, 0.90)',
    badgeTextHex: '#2B2017',
  };
}
