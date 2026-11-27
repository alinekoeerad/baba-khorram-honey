'use client';

/**
 * Card Palette Context & Hook
 *
 * Distributes the active site card palette (configured in SiteSettings by the admin)
 * to all cards, listings, carousels, and search results across the public site.
 */

import React, { createContext, useContext, useMemo } from 'react';
import { CardPaletteItem, DEFAULT_CARD_PALETTE } from './card-palette';

const CardPaletteContext = createContext<CardPaletteItem[]>(DEFAULT_CARD_PALETTE);

export function CardPaletteProvider({
  palette,
  children,
}: {
  palette?: CardPaletteItem[] | null;
  children: React.ReactNode;
}) {
  const safePalette = useMemo(() => {
    if (palette && Array.isArray(palette) && palette.length >= 3) {
      // Ensure all items strictly have white text
      return palette.map((item) => ({
        ...item,
        textHex: '#FFFFFF',
        subtextHex: item.subtextHex || 'rgba(255, 255, 255, 0.88)',
      }));
    }
    return DEFAULT_CARD_PALETTE;
  }, [palette]);

  return (
    <CardPaletteContext.Provider value={safePalette}>
      {children}
    </CardPaletteContext.Provider>
  );
}

export function useCardPalette(): CardPaletteItem[] {
  const context = useContext(CardPaletteContext);
  return context || DEFAULT_CARD_PALETTE;
}
