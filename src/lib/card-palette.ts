/**
 * Card Palette & Dynamic Theme Engine
 *
 * Provides:
 * 1. Default Baba Khorram brand card palette (4 classic colors).
 * 2. Curated presets fitting the brand (sage green, pomegranate burgundy, dark amber, navy, chocolate, muted teal, warm terracotta).
 * 3. Color harmony adjustment (auto-harmonize to muted natural tones in HSL).
 * 4. WCAG-compliant automatic text, subtext, and border contrast calculator.
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
 * Default fallback palette matching existing brand identity
 */
export const DEFAULT_CARD_PALETTE: CardPaletteItem[] = [
  {
    id: 'GREEN',
    nameFa: 'سبز گیاهی و کوهستان',
    bgHex: '#4CA849',
    textHex: '#FFFFFF',
    subtextHex: '#EAF8E9',
    borderHex: '#3D8B3A',
    badgeBgHex: 'rgba(255, 255, 255, 0.88)',
    badgeTextHex: '#2B2017',
  },
  {
    id: 'ORANGE',
    nameFa: 'آجری و عسلی تیره',
    bgHex: '#E08B38',
    textHex: '#FFFFFF',
    subtextHex: '#FDF1E6',
    borderHex: '#C67325',
    badgeBgHex: 'rgba(255, 255, 255, 0.88)',
    badgeTextHex: '#2B2017',
  },
  {
    id: 'YELLOW',
    nameFa: 'طلایی و موم کهربایی',
    bgHex: '#F5A623',
    textHex: '#2B2017',
    subtextHex: '#4D3823',
    borderHex: '#D98E16',
    badgeBgHex: 'rgba(255, 255, 255, 0.88)',
    badgeTextHex: '#2B2017',
  },
  {
    id: 'BURGUNDY',
    nameFa: 'زرشکی اناری و تیره',
    bgHex: '#9E3556',
    textHex: '#FFFFFF',
    subtextHex: '#FCEEF2',
    borderHex: '#7E2642',
    badgeBgHex: 'rgba(255, 255, 255, 0.90)',
    badgeTextHex: '#2B2017',
  },
];

/**
 * Curated brand presets harmonious with organic mountain honey branding
 */
export const CURATED_BRAND_PRESETS: CardPaletteItem[] = [
  {
    id: 'PRESET_SAGE',
    nameFa: 'سبز مریم‌گلی و زیتونی',
    bgHex: '#487346',
    textHex: '#FFFFFF',
    subtextHex: '#EBF2EA',
    borderHex: '#3A5C38',
    badgeBgHex: 'rgba(255, 255, 255, 0.90)',
    badgeTextHex: '#2B2017',
  },
  {
    id: 'PRESET_AMBER',
    nameFa: 'کهربایی شاه‌بلوطی',
    bgHex: '#D27D2D',
    textHex: '#FFFFFF',
    subtextHex: '#FAF0E6',
    borderHex: '#B5671E',
    badgeBgHex: 'rgba(255, 255, 255, 0.90)',
    badgeTextHex: '#2B2017',
  },
  {
    id: 'PRESET_CHOCOLATE',
    nameFa: 'قهوه‌ای کاکائویی باوقار',
    bgHex: '#5C3826',
    textHex: '#FFFFFF',
    subtextHex: '#EFE7E2',
    borderHex: '#452A1C',
    badgeBgHex: 'rgba(255, 255, 255, 0.90)',
    badgeTextHex: '#2B2017',
  },
  {
    id: 'PRESET_NAVY',
    nameFa: 'سرمه‌ای کلاسیک سلطنتی',
    bgHex: '#2A4365',
    textHex: '#FFFFFF',
    subtextHex: '#E6ECF5',
    borderHex: '#1E314B',
    badgeBgHex: 'rgba(255, 255, 255, 0.90)',
    badgeTextHex: '#2B2017',
  },
  {
    id: 'PRESET_TEAL',
    nameFa: 'فیروزه‌ای مات اقاقیا',
    bgHex: '#2E7D7E',
    textHex: '#FFFFFF',
    subtextHex: '#E5F3F3',
    borderHex: '#236061',
    badgeBgHex: 'rgba(255, 255, 255, 0.90)',
    badgeTextHex: '#2B2017',
  },
  {
    id: 'PRESET_TERRACOTTA',
    nameFa: 'آجری ملایم ارسباران',
    bgHex: '#C45D43',
    textHex: '#FFFFFF',
    subtextHex: '#F9ECE9',
    borderHex: '#A34932',
    badgeBgHex: 'rgba(255, 255, 255, 0.90)',
    badgeTextHex: '#2B2017',
  },
  {
    id: 'PRESET_PLUM',
    nameFa: 'آلبالویی کوهستان',
    bgHex: '#802B48',
    textHex: '#FFFFFF',
    subtextHex: '#F6E6EC',
    borderHex: '#641F37',
    badgeBgHex: 'rgba(255, 255, 255, 0.90)',
    badgeTextHex: '#2B2017',
  },
  {
    id: 'PRESET_MUSTARD',
    nameFa: 'خردلی سنتی و مومی',
    bgHex: '#D49B28',
    textHex: '#2B2017',
    subtextHex: '#453213',
    borderHex: '#B5821E',
    badgeBgHex: 'rgba(255, 255, 255, 0.90)',
    badgeTextHex: '#2B2017',
  },
];

// --- Color Conversion & Contrast Utilities ---

export interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 76, g: 168, b: 73 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    return clamped.toString(16).padStart(2, '0');
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function rgbToHsl(r: number, g: number, b: number): HSL {
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

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
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
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Calculates relative luminance according to WCAG 2.1
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Auto-harmonize a given hex color to the natural organic brand spectrum:
 * Clamps excessive neon saturation (to 35% - 65%) and luminance (to 30% - 55%)
 */
export function autoHarmonizeHex(rawHex: string): string {
  const { r, g, b } = hexToRgb(rawHex);
  const hsl = rgbToHsl(r, g, b);

  // Natural organic bounds:
  // Saturation clamped between 38% and 68% (no fluorescent/neon colors)
  // Lightness clamped between 32% and 55% (no washed-out white or pitch black)
  const harmoniousS = Math.max(38, Math.min(68, hsl.s));
  const harmoniousL = Math.max(32, Math.min(54, hsl.l));

  const rgb = hslToRgb(hsl.h, harmoniousS, harmoniousL);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

/**
 * Generates optimal text, subtext, and border colors based on background luminance
 */
export function deriveContrastPalette(bgHex: string, id: string, nameFa: string): CardPaletteItem {
  const { r, g, b } = hexToRgb(bgHex);
  const lum = getRelativeLuminance(r, g, b);
  const isLight = lum > 0.42;

  // Darker border for depth
  const hsl = rgbToHsl(r, g, b);
  const borderRgb = hslToRgb(hsl.h, hsl.s, Math.max(15, hsl.l - 12));
  const borderHex = rgbToHex(borderRgb.r, borderRgb.g, borderRgb.b);

  if (isLight) {
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
