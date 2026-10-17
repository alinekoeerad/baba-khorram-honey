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
 * Slim, modern, professional toggle switch with crisp 90-degree corners.
 * - Active: Modern Green (bg-emerald-600)
 * - Inactive: Clean Neutral Gray (bg-gray-300)
 * - Thumb: Crisp white square, perfectly centered with balanced 4px padding on all sides.
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

      {/* Slim Switch Track (h-6 w-11) */}
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        dir="ltr"
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-none transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? 'bg-emerald-600' : 'bg-gray-300'
        }`}
      >
        {/* Thumb: Crisp white square with smooth slide */}
        <span
          aria-hidden="true"
          className={`inline-block h-4 w-4 transform bg-white shadow-xs ring-0 transition-transform duration-200 ease-in-out rounded-none ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
