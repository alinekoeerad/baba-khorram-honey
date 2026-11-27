'use client';

/**
 * useGridColumns Hook
 *
 * Reliably detects active grid columns based on Tailwind breakpoints
 * to feed into the non-adjacent vertical/horizontal card coloring algorithm.
 * Prevents hydration mismatches by initializing with SSR fallback.
 */

import { useState, useEffect } from 'react';

export interface GridBreakpointsConfig {
  /** Column count for < sm (mobile). Default: 1 */
  base?: number;
  /** Column count for >= sm (640px). Default: 2 */
  sm?: number;
  /** Column count for >= md (768px). Default: 3 */
  md?: number;
  /** Column count for >= lg (1024px). Default: 4 */
  lg?: number;
  /** Column count for >= xl (1280px). Default: 5 */
  xl?: number;
  /** Column count for >= 2xl (1536px). Default: 5 */
  '2xl'?: number;
}

const DEFAULT_CATALOG_CONFIG: GridBreakpointsConfig = {
  base: 1,
  sm: 2,
  md: 3,
  lg: 4,
  xl: 5,
};

function getActiveColumns(config: GridBreakpointsConfig): number {
  if (typeof window === 'undefined') {
    // Default desktop SSR fallback
    return config.xl || config.lg || config.md || config.sm || config.base || 4;
  }

  const w = window.innerWidth;
  if (config['2xl'] !== undefined && w >= 1536) return config['2xl'];
  if (config.xl !== undefined && w >= 1280) return config.xl;
  if (config.lg !== undefined && w >= 1024) return config.lg;
  if (config.md !== undefined && w >= 768) return config.md;
  if (config.sm !== undefined && w >= 640) return config.sm;
  return config.base || 1;
}

export function useGridColumns(
  customConfig?: GridBreakpointsConfig,
  ssrFallback?: number
): number {
  const config = customConfig || DEFAULT_CATALOG_CONFIG;
  const initial = ssrFallback || config.xl || config.lg || config.md || 4;

  const [columns, setColumns] = useState<number>(initial);

  useEffect(() => {
    const update = () => {
      setColumns(getActiveColumns(config));
    };

    update();
    window.addEventListener('resize', update, { passive: true });
    return () => window.removeEventListener('resize', update);
  }, [
    config.base,
    config.sm,
    config.md,
    config.lg,
    config.xl,
    config['2xl'],
  ]);

  return columns;
}
