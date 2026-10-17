'use client';

import React from 'react';

export interface AdminToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  id?: string;
  className?: string;
}

/**
 * AdminToggleSwitch
 * Crisp 90-degree square corners with pixel-perfect vertical and horizontal symmetry.
 * Enforces balanced 2px padding on all sides in both active and inactive states.
 */
export function AdminToggleSwitch({
  checked,
  onChange,
  disabled = false,
  label,
  description,
  id,
  className = '',
}: AdminToggleSwitchProps) {
  const switchId = id || (label ? `switch_${label.replace(/\s+/g, '_')}` : undefined);

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      {(label || description) && (
        <div className="space-y-0.5 text-right flex-1 select-none">
          {label && (
            <label
              htmlFor={switchId}
              className={`block text-sm font-bold cursor-pointer ${
                disabled ? 'text-stone-400' : 'text-[#2B2017]'
              }`}
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-[#5C5248] leading-relaxed">{description}</p>
          )}
        </div>
      )}

      {/* Switch Track (48px x 24px) with isolated LTR coordinate space */}
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        dir="ltr"
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-none border border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? 'bg-[#15803D]' : 'bg-stone-300'
        }`}
      >
        {/* Switch Thumb (20px x 20px) - Exactly 2px padding on top, bottom, left, and right */}
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute top-[2px] left-[2px] inline-block h-5 w-5 transform rounded-none bg-white shadow-xs ring-0 transition-transform duration-200 ease-in-out ${
            checked ? 'translate-x-[24px]' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
