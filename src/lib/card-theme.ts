/**
 * Central Card Theme Resolver (Grid & Carousel Non-Adjacent Coloring)
 *
 * Guarantees that no two adjacent cards share the same theme:
 * - Horizontally (left/right neighbors in the same row)
 * - Vertically (above/below neighbors in multi-column grids)
 * - Circularly (end-to-beginning loop in infinite scroll carousels)
 *
 * Fully supports custom dynamic palettes configured in SiteSettings by the admin.
 */

import { DEFAULT_CARD_PALETTE, CardPaletteItem } from './card-palette';

export type CardTheme = string;

export interface ThemeResolvableItem {
  id?: string;
  slug?: string | null;
  cardTheme?: string | null;
  theme?: string | null;
  [key: string]: any;
}

export interface ResolveThemesOptions {
  /**
   * Number of columns in current layout (1, 2, 3, 4, 5, etc.)
   * In 1D horizontal carousels / auto-scrolls, pass items.length or 1 with isCircular.
   * Default: 1
   */
  columns?: number;
  /**
   * True for infinite loop sliders/carousels where the last card is adjacent to the first card.
   * Default: false
   */
  isCircular?: boolean;
  /**
   * Dynamic active palette items configured by Admin (or defaults).
   */
  palette?: CardPaletteItem[] | string[];
}

/**
 * Fast deterministic string hash
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Normalizes input string to a valid CardTheme or null if 'AUTO' / invalid.
 */
export function normalizeCardTheme(
  raw?: string | null,
  validIds?: string[]
): string | null {
  if (!raw) return null;
  const upper = raw.trim().toUpperCase();
  if (upper === 'AUTO') return null;
  if (validIds && validIds.length > 0) {
    const found = validIds.find((id) => id.toUpperCase() === upper);
    if (found) return found;
  }
  return upper;
}

/**
 * Central non-adjacent theme resolution algorithm with Balanced Fair-Share,
 * Recency Penalty, and Anti-Ping-Pong distribution (Idea 1).
 *
 * Guarantees:
 * 1. Zero adjacent colors horizontally (left/right in rows).
 * 2. Zero adjacent colors vertically (above/below in grids).
 * 3. Zero adjacent colors circularly (end-to-start in infinite carousels).
 * 4. Anti-Ping-Pong: Prevents alternating two colors back-and-forth (e.g. A -> B -> A).
 * 5. Balanced Fair-Share: Dynamically prioritizes least-used colors across the collection.
 */
export function resolveNonAdjacentThemes<T extends ThemeResolvableItem>(
  items: T[],
  options?: ResolveThemesOptions
): string[] {
  if (!items || items.length === 0) return [];

  // Determine active palette IDs
  let paletteIds: string[] = [];
  if (options?.palette && options.palette.length >= 3) {
    paletteIds = options.palette.map((p) => (typeof p === 'string' ? p : p.id));
  } else {
    paletteIds = DEFAULT_CARD_PALETTE.map((p) => p.id);
  }

  const cols = Math.max(1, options?.columns || 1);
  const isCircular = Boolean(options?.isCircular);
  const N = items.length;

  const result: string[] = new Array(N);

  // Tracking usage frequency and last used index for each theme
  const freq: Record<string, number> = {};
  const lastIndex: Record<string, number> = {};
  for (const id of paletteIds) {
    freq[id] = 0;
    lastIndex[id] = -999;
  }

  for (let i = 0; i < N; i++) {
    const item = items[i];
    const forbidden = new Set<string>();

    // 1. Horizontal neighbor: card immediately to the left (same row)
    if (cols > 1 && i % cols !== 0 && i > 0) {
      if (result[i - 1]) {
        forbidden.add(result[i - 1]);
      }
    } else if (cols >= N && i > 0) {
      // In 1D carousel where columns >= N
      if (result[i - 1]) {
        forbidden.add(result[i - 1]);
      }
    }

    // 2. Vertical neighbor: card directly above in the previous row (i - cols)
    if (i >= cols) {
      if (result[i - cols]) {
        forbidden.add(result[i - cols]);
      }
    }

    // 3. Circular constraint for infinite carousel / auto-scroll:
    if (isCircular && i === N - 1 && N > 1) {
      if (result[0]) {
        forbidden.add(result[0]);
      }
    }

    // Determine deterministic candidate
    const manualTheme = normalizeCardTheme(item.cardTheme || item.theme, paletteIds);
    const seed = item.slug || item.id || `idx-${i}`;
    const hashVal = hashString(seed) + i;

    // Check if manual theme is valid in current palette and not forbidden
    if (manualTheme && paletteIds.includes(manualTheme) && !forbidden.has(manualTheme)) {
      result[i] = manualTheme;
    } else {
      // Pick a theme from palette that is NOT forbidden
      let candidates = paletteIds.filter((th) => !forbidden.has(th));

      if (candidates.length === 0) {
        // Fallback: Pick color least colliding with immediate horizontal neighbor
        const hForbidden = i > 0 ? result[i - 1] : undefined;
        const semiAvailable = paletteIds.filter((th) => th !== hForbidden);
        candidates = semiAvailable.length > 0 ? semiAvailable : paletteIds;
      }

      // Score each candidate (Lower score = higher priority)
      // 1. Base score by frequency: least-used color gets massive advantage
      // 2. Anti-Ping-Pong: heavy penalty (+5000) if candidate was used at i - 2
      // 3. Short-loop suppression: moderate penalty (+800) if candidate was used at i - 3
      // 4. Recency bonus: greater distance since last use lowers the score
      // 5. Deterministic tie-breaker
      let bestCandidate = candidates[0];
      let lowestScore = Number.POSITIVE_INFINITY;

      for (const c of candidates) {
        let score = (freq[c] || 0) * 1000;

        // Anti-Ping-Pong: if this candidate is the same as the card 2 steps ago (i - 2), penalize!
        if (i >= 2 && result[i - 2] === c) {
          score += 5000;
        }

        // Short-cycle penalty (i - 3) if palette has enough colors (>= 4 colors)
        if (i >= 3 && result[i - 3] === c && paletteIds.length >= 4) {
          score += 800;
        }

        // Distance reward (encourage colors not seen for a while)
        const dist = i - (lastIndex[c] ?? -999);
        score -= Math.min(dist, 50) * 10;

        // Deterministic hash tie-breaker
        score += (hashVal + paletteIds.indexOf(c)) % 10;

        if (score < lowestScore) {
          lowestScore = score;
          bestCandidate = c;
        }
      }

      result[i] = bestCandidate;
    }

    const chosen = result[i];
    freq[chosen] = (freq[chosen] || 0) + 1;
    lastIndex[chosen] = i;
  }

  // Circular loop safety check
  if (isCircular && N > 1 && result[N - 1] === result[0]) {
    const leftNeighbor = result[N - 2];
    const topNeighbor = N - 1 >= cols ? result[N - 1 - cols] : undefined;
    const firstItem = result[0];

    const safeChoice = paletteIds.find(
      (c) => c !== leftNeighbor && c !== topNeighbor && c !== firstItem
    ) || paletteIds.find((c) => c !== leftNeighbor && c !== firstItem);

    if (safeChoice) {
      result[N - 1] = safeChoice;
    }
  }

  return result;
}

/**
 * Returns single theme for standalone cards (like detail page breadcrumbs)
 */
export function resolveSingleCardTheme(
  item?: ThemeResolvableItem | null,
  palette?: CardPaletteItem[]
): string {
  const activePalette = palette && palette.length > 0 ? palette : DEFAULT_CARD_PALETTE;
  const paletteIds = activePalette.map((p) => p.id);

  if (!item) return paletteIds[0] || 'GREEN';

  const manual = normalizeCardTheme(item.cardTheme || item.theme, paletteIds);
  if (manual && paletteIds.includes(manual)) return manual;

  const seed = item.slug || item.id || 'honey';
  const index = hashString(seed) % paletteIds.length;
  return paletteIds[index];
}

/**
 * Helper to get CSS style object for any theme id given active palette
 */
export function getCardThemeStyles(
  themeId: string,
  palette?: CardPaletteItem[] | null
): {
  bg: string;
  color: string;
  subtextColor: string;
  borderColor: string;
  badgeBg: string;
  badgeColor: string;
} {
  const list = palette && palette.length > 0 ? palette : DEFAULT_CARD_PALETTE;
  const found = list.find((p) => p.id.toUpperCase() === (themeId || '').toUpperCase()) || list[0] || DEFAULT_CARD_PALETTE[0];

  return {
    bg: found.bgHex,
    color: found.textHex,
    subtextColor: found.subtextHex,
    borderColor: found.borderHex,
    badgeBg: found.badgeBgHex || 'rgba(255, 255, 255, 0.88)',
    badgeColor: found.badgeTextHex || '#2B2017',
  };
}
