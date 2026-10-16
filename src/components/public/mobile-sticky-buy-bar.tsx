'use client';

import React, { useState, useEffect } from 'react';
import { PillButton } from '@/components/ui/pill-button';
import { useCartStore } from '@/lib/cart-store';
import { ShoppingCart, Check } from 'lucide-react';

interface MobileStickyBuyBarProps {
  productId: string;
  productName: string;
  isAvailable: boolean;
  cartEnabled: boolean;
  defaultOptionId?: string;
}

export function MobileStickyBuyBar({
  productId,
  productName,
  isAvailable,
  cartEnabled,
  defaultOptionId,
}: MobileStickyBuyBarProps) {
  const { actions } = useCartStore();
  const [isVisible, setIsVisible] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Reveal sticky bar after user scrolls down 350px
      if (window.scrollY > 350) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isAvailable || !cartEnabled || !isVisible) {
    return null;
  }

  const handleBuy = () => {
    const optId = defaultOptionId || `opt_${productId}_1kg`;
    const res = actions.addItem({
      productId,
      optionId: optId,
      qty: 1,
    });

    if (res.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    }
  };

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#23150B]/95 border-t-2 border-[#F59E0B] p-3 shadow-[0_-10px_25px_rgba(0,0,0,0.5)] backdrop-blur-md flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300">
      <div className="text-right truncate flex-1 min-w-0 pr-1">
        <div className="text-xs font-black text-[#2B2017] truncate">
          {productName}
        </div>
        <div className="text-[11px] text-[#D97706] font-bold">
          {added ? '✓ به سبد اضافه شد' : '۱۰۰٪ طبیعی و دارای برگه آزمایش'}
        </div>
      </div>

      <div className="shrink-0">
        <PillButton
          variant="gold"
          size="sm"
          onClick={handleBuy}
          className="font-black text-xs px-4 py-2.5 shadow-lg flex items-center gap-1.5"
        >
          {added ? (
            <>
              <Check className="w-4 h-4 text-emerald-950" />
              <span>ثبت شد</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              <span>افزودن به سبد</span>
            </>
          )}
        </PillButton>
      </div>
    </div>
  );
}
