import React from 'react';
import { cn } from '@/lib/utils';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  size?: 'default' | 'narrow' | 'wide';
}

export function Container({ children, size = 'default', className, ...props }: ContainerProps) {
  const sizeClasses = {
    default: 'max-w-7xl',
    narrow: 'max-w-5xl',
    wide: 'max-w-[1440px]',
  }[size];

  return (
    <div className={cn('w-full mx-auto px-4 sm:px-6 lg:px-8', sizeClasses, className)} {...props}>
      {children}
    </div>
  );
}
