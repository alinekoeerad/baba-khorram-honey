import React from 'react';
import { cn } from '@/lib/utils';

export interface WoodBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * WoodBackground Component
 * Renders the authentic natural wood grain texture (/images/wood-bg.jpg).
 *
 * Requirements:
 * - NO dark overlay (raw natural wood texture).
 * - NO zoom/stretching (background-repeat: repeat with natural background-size so it tiles seamlessly across tall pages).
 * - Text color defaults to high-contrast crisp text (#E6DDD4 and #FFFFFF).
 */
export function WoodBackground({
  children,
  className,
  ...props
}: WoodBackgroundProps) {
  return (
    <section
      className={cn(
        'relative bg-[#FAF7F2] text-[#2B2017] overflow-hidden',
        className
      )}
      style={{
        backgroundImage: "url('/images/wood-bg.jpg')",
        backgroundRepeat: 'repeat',
        backgroundPosition: 'top center',
        backgroundSize: '800px auto',
      }}
      {...props}
    >
      <div className="relative z-10 text-[#2B2017]">{children}</div>
    </section>
  );
}
