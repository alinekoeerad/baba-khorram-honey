'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export interface ToastContextValue {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastMessage, 'id'>) => {
      const id = Math.random().toString(36).slice(2, 9);
      setToasts((prev) => [...prev, { id, type, title, message, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((message: string, title?: string) => {
    showToast({ type: 'success', message, title });
  }, [showToast]);

  const error = useCallback((message: string, title?: string) => {
    showToast({ type: 'error', message, title, duration: 6000 });
  }, [showToast]);

  const warning = useCallback((message: string, title?: string) => {
    showToast({ type: 'warning', message, title, duration: 5000 });
  }, [showToast]);

  const info = useCallback((message: string, title?: string) => {
    showToast({ type: 'info', message, title });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, showSuccess: success, showError: error }}>
      {children}
      {/* Toast container pinned to bottom-left (in RTL, natural reading flow) */}
      <div
        aria-live="polite"
        className="fixed bottom-6 left-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => {
          const config = {
            success: {
              border: 'border-emerald-600',
              bg: 'bg-emerald-50 text-emerald-950 font-bold',
              icon: CheckCircle2,
              iconColor: 'text-emerald-700',
            },
            error: {
              border: 'border-red-600',
              bg: 'bg-red-50 text-red-950 font-bold',
              icon: AlertCircle,
              iconColor: 'text-red-700',
            },
            warning: {
              border: 'border-amber-500',
              bg: 'bg-amber-50 text-amber-950 font-semibold',
              icon: AlertTriangle,
              iconColor: 'text-amber-700',
            },
            info: {
              border: 'border-sky-500',
              bg: 'bg-sky-50 text-sky-950 font-semibold',
              icon: Info,
              iconColor: 'text-sky-700',
            },
          }[t.type];

          const Icon = config.icon;

          return (
            <div
              key={t.id}
              role="alert"
              className={`pointer-events-auto p-4 border-2 ${config.border} ${config.bg} rounded-none shadow-2xl flex items-start gap-3 text-right backdrop-blur-md animate-in slide-in-from-bottom duration-200`}
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.iconColor}`} />
              <div className="flex-1 min-w-0 space-y-0.5">
                {t.title && (
                  <p className="font-black text-xs sm:text-sm">{t.title}</p>
                )}
                <p className="text-xs sm:text-sm font-medium leading-relaxed">
                  {t.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="opacity-70 hover:opacity-100 transition-opacity p-0.5 cursor-pointer shrink-0"
                aria-label="بستن اعلان"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
