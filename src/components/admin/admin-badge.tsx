'use client';

import React from 'react';

export type AdminStatus =
  | 'PUBLISHED'
  | 'ACTIVE'
  | 'DRAFT'
  | 'ARCHIVED'
  | 'OUT_OF_STOCK'
  | 'NEW'
  | 'READ'
  | 'REVIEWED'
  | 'RESOLVED';

interface AdminBadgeProps {
  status: AdminStatus | string;
  label?: string;
  className?: string;
}

export function AdminBadge({ status, label, className = '' }: AdminBadgeProps) {
  const normalized = status.toUpperCase();

  const configs: Record<
    string,
    { label: string; bg: string; text: string; border: string; pulse?: boolean }
  > = {
    PUBLISHED: {
      label: 'منتشرشده',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      pulse: true,
    },
    ACTIVE: {
      label: 'فعال',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      pulse: true,
    },
    DRAFT: {
      label: 'پیش‌نویس',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
    },
    ARCHIVED: {
      label: 'بایگانی‌شده',
      bg: 'bg-stone-100',
      text: 'text-stone-600',
      border: 'border-stone-200',
    },
    OUT_OF_STOCK: {
      label: 'ناموجود',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
    },
    NEW: {
      label: 'جدید',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      pulse: true,
    },
    READ: {
      label: 'خوانده‌شده',
      bg: 'bg-stone-100',
      text: 'text-stone-600',
      border: 'border-stone-200',
    },
    REVIEWED: {
      label: 'بررسی‌شده',
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
    },
    RESOLVED: {
      label: 'حل‌شده',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
    },
  };

  const current = configs[normalized] || {
    label: status,
    bg: 'bg-stone-100',
    text: 'text-stone-700',
    border: 'border-stone-200',
  };

  const displayText = label || current.label;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${current.bg} ${current.text} ${current.border} ${className}`}
    >
      {current.pulse && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
      )}
      <span>{displayText}</span>
    </span>
  );
}
