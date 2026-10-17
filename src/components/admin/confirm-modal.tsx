'use client';

import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  itemName?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title = 'تأیید عملیات',
  itemName,
  message,
  confirmLabel = 'تأیید و ادامه',
  cancelLabel = 'انصراف',
  isDestructive = true,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-md bg-white border-2 border-stone-300 rounded-none shadow-2xl p-6 text-right space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-none flex items-center justify-center shrink-0 ${
              isDestructive
                ? 'bg-red-50 text-red-700 border-2 border-red-600'
                : 'bg-amber-50 text-amber-950 border-2 border-amber-500'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div className="flex-1 space-y-1">
            <h3 className="text-base sm:text-lg font-black text-[#2B2017]">
              {title}
            </h3>
            {itemName && (
              <p className="text-xs sm:text-sm font-black text-[#C86A00] truncate">
                «{itemName}»
              </p>
            )}
            <p className="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed">
              {message || 'آیا از انجام این عملیات اطمینان کامل دارید؟ این اقدام ممکن است غیرقابل بازگشت باشد.'}
            </p>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-200">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="px-4 py-2 text-xs sm:text-sm font-bold border border-stone-300 rounded-none bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`px-5 py-2 text-xs sm:text-sm font-black rounded-none shadow-sm flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-[#F59E0B] hover:bg-[#D97706] text-[#2B2017]'
            }`}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
