import React from 'react';
import { cn } from '@/lib/utils';

export interface DottedArrowIconProps {
  className?: string;
  direction?: 'left' | 'right';
}

/**
 * Dotted Arrow Icon (honey.com Brand Fidelity)
 * Replicates the authentic honey.com arrow made of 8 green/currentColor dots:
 * 3 shaft dots, 4 wing dots, and 1 tip dot.
 * Points left for RTL reading flow, points right for LTR.
 */
export function DottedArrowIcon({
  className,
  direction = 'left',
}: DottedArrowIconProps) {
  return (
    <svg
      className={cn('w-5 h-5 shrink-0 transition-transform duration-200 select-none', className)}
      viewBox="0 0 32 32"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      {direction === 'left' ? (
        // RTL Left-pointing Dotted Arrow
        <g>
          {/* Horizontal Shaft Dots */}
          <circle cx="27" cy="16" r="2.1" />
          <circle cx="21" cy="16" r="2.1" />
          <circle cx="15" cy="16" r="2.1" />

          {/* Upper Wing Dots */}
          <circle cx="15" cy="7" r="2.1" />
          <circle cx="10" cy="11.5" r="2.1" />

          {/* Arrow Tip Dot */}
          <circle cx="5" cy="16" r="2.1" />

          {/* Lower Wing Dots */}
          <circle cx="10" cy="20.5" r="2.1" />
          <circle cx="15" cy="25" r="2.1" />
        </g>
      ) : (
        // LTR Right-pointing Dotted Arrow
        <g>
          {/* Horizontal Shaft Dots */}
          <circle cx="5" cy="16" r="2.1" />
          <circle cx="11" cy="16" r="2.1" />
          <circle cx="17" cy="16" r="2.1" />

          {/* Upper Wing Dots */}
          <circle cx="17" cy="7" r="2.1" />
          <circle cx="22" cy="11.5" r="2.1" />

          {/* Arrow Tip Dot */}
          <circle cx="27" cy="16" r="2.1" />

          {/* Lower Wing Dots */}
          <circle cx="22" cy="20.5" r="2.1" />
          <circle cx="17" cy="25" r="2.1" />
        </g>
      )}
    </svg>
  );
}
