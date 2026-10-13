'use client';

/**
 * Header Cart Icon (Phase 9 Task 4)
 * Client island displaying the cart link and dynamic item count badge.
 * Renders nothing if cartEnabled is false.
 */

import React from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { toPersianDigits } from '@/lib/domain-utils';

export function HeaderCartIcon({ cartEnabled }: { cartEnabled: boolean }) {
  const { totalQuantity } = useCartStore();

  if (!cartEnabled) {
    return null;
  }

  const displayCount =
    totalQuantity > 99 ? '+۹۹' : toPersianDigits(totalQuantity);

  return (
    <Link
      href="/cart"
      aria-label={`سبد خرید${totalQuantity > 0 ? ` (${toPersianDigits(totalQuantity)} مورد)` : ''}`}
      className="relative p-2.5 rounded-none text-white hover:bg-black/20 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      <ShoppingCart className="w-5 h-5 text-white drop-shadow-sm" />
      {totalQuantity > 0 && (
        <span
          className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-[#D97706] text-white text-[11px] font-black rounded-full flex items-center justify-center ring-2 ring-white shadow-sm pointer-events-none"
        >
          {displayCount}
        </span>
      )}
    </Link>
  );
}
