import React from 'react';
import { cn } from '@/lib/utils';

export interface SectionHeadingProps {
  title: string;
  subtitle?: string | null;
  align?: 'center' | 'right' | 'left';
  inverted?: boolean;
  className?: string;
}

export function SectionHeading({
  title,
  subtitle,
  align = 'center',
  inverted = false,
  className,
}: SectionHeadingProps) {
  const alignClass = {
    center: 'text-center items-center',
    right: 'text-right items-start',
    left: 'text-left items-end',
  }[align];

  return (
    <div className={cn('flex flex-col mb-8 sm:mb-12', alignClass, className)}>
      <h2
        className={cn(
          'text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight',
          inverted ? 'text-white' : 'text-[#2B2017]'
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            'text-sm sm:text-base mt-2.5 max-w-2xl font-medium',
            inverted ? 'text-[#E8E2D9]' : 'text-[#5C5248]'
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
