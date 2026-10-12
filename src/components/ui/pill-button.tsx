import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { DottedArrowIcon } from './dotted-arrow-icon';

export interface PillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'green' | 'gold' | 'orange';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  asChild?: boolean;
}

/**
 * Authentic Pill Button Component (honey.com Brand Fidelity)
 * Features:
 * - Rounded pill shape (rounded-full)
 * - Label followed by the signature honey.com dotted arrow icon
 * - Hover shifts arrow slightly (-translate-x-1.5 in RTL)
 * - Variants: green, gold, orange
 * - Can render as <button> or as Next.js <Link> via href prop
 */
export const PillButton = React.forwardRef<any, PillButtonProps>(
  ({ className, variant = 'gold', size = 'md', href, children, ...props }, ref) => {
    const variantStyles = {
      gold: 'bg-[#FBBF24] text-[#332115] hover:bg-[#F59E0B] border-transparent focus-visible:ring-[#FBBF24]',
      green: 'bg-[#3F8F3B] text-white hover:bg-[#347831] border-transparent focus-visible:ring-[#3F8F3B]',
      orange: 'bg-[#E08D2B] text-white hover:bg-[#c96a1e] border-transparent focus-visible:ring-[#E07D2B]',
    };

    const sizeStyles = {
      sm: 'px-4 py-1.5 text-xs gap-1.5',
      md: 'px-6 py-2.5 text-sm gap-2',
      lg: 'px-8 py-3 text-base gap-2.5',
    };

    const combinedClassName = cn(
      'honey-pill-button group inline-flex items-center justify-center font-bold rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 disabled:pointer-events-none disabled:opacity-50 select-none shadow-xs hover:shadow-md hover:-translate-y-0.5',
      variantStyles[variant],
      sizeStyles[size],
      className
    );

    const arrowIcon = (
      <DottedArrowIcon
        direction="left"
        className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:-translate-x-1.5"
      />
    );

    if (href) {
      return (
        <Link href={href} ref={ref} className={combinedClassName} {...(props as any)}>
          <span>{children}</span>
          {arrowIcon}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        type="button"
        className={combinedClassName}
        {...props}
      >
        <span>{children}</span>
        {arrowIcon}
      </button>
    );
  }
);

PillButton.displayName = 'PillButton';
