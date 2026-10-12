import React from 'react';
import { cn } from '@/lib/utils';

export interface WoodGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function WoodGroup({ children, className, ...props }: WoodGroupProps) {
  return (
    <div
      className={cn(
        'relative bg-[#2B1B10] bg-cover bg-center bg-fixed text-white overflow-hidden',
        className
      )}
      style={{
        backgroundImage: "url('/images/wood-bg.jpg')",
      }}
      {...props}
    >
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ backgroundColor: 'rgba(35, 20, 10, 0.45)' }}
        aria-hidden="true"
      />
      <div className="relative z-10 divide-y divide-white/10">{children}</div>
    </div>
  );
}
