import React from 'react';
import { cn } from '@/lib/utils';

export interface WoodGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function WoodGroup({ children, className, ...props }: WoodGroupProps) {
  return (
    <div
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
      <div className="relative z-10 divide-y divide-[#EFE9E0]/60">{children}</div>
    </div>
  );
}
