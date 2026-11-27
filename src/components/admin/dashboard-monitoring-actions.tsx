'use client';

import React, { useState, useTransition } from 'react';
import { Download, RefreshCw, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { resendOrderNotificationAction } from '@/server/actions/order-actions';

export function DatabaseBackupButton() {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    // Direct link to our secure GET endpoint which streams Content-Disposition attachment
    window.location.href = '/api/admin/backup';
    setTimeout(() => {
      setDownloading(false);
    }, 2500);
  };

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      type="button"
      className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#2B2017] hover:bg-[#433427] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
      title="دانلود نسخه کامل پشتیبان از تمام جداول پایگاه داده در قالب JSON"
    >
      <Download className={`w-3.5 h-3.5 ${downloading ? 'animate-bounce text-amber-400' : 'text-amber-400'}`} />
      <span>{downloading ? 'در حال آماده‌سازی...' : 'دانلود پشتیبان دیتابیس (JSON)'}</span>
    </button>
  );
}

export function ResendOrderNotificationButton({
  orderId,
  orderCode,
}: {
  orderId: string;
  orderCode: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const handleResend = () => {
    startTransition(async () => {
      try {
        const res = await resendOrderNotificationAction(orderId);
        if (res.success) {
          setStatus('success');
          const services = Object.entries(res.services || {})
            .map(([srv, state]) => `${srv}: ${state === 'sent' ? 'ارسال شد' : state === 'skipped' ? 'تنظیم‌نشده' : 'ناموفق'}`)
            .join(' | ');
          setMessage(res.dispatched ? `ارسال شد (${services})` : `رباتی فعال نیست (${services})`);
        } else {
          setStatus('error');
          setMessage(res.error || 'خطا در ارسال');
        }
      } catch (err: any) {
        setStatus('error');
        setMessage(err?.message || 'خطای شبکه');
      }
    });
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={handleResend}
        disabled={isPending}
        type="button"
        className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-bold rounded-none transition-colors disabled:opacity-50 cursor-pointer"
        title={`ارسال مجدد پیام سفارش ${orderCode} به ربات‌های پیام‌رسان`}
      >
        {isPending ? (
          <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
        ) : (
          <Send className="w-3 h-3 text-amber-600" />
        )}
        <span>{isPending ? 'در حال ارسال...' : 'ارسال مجدد اعلان'}</span>
      </button>

      {status === 'success' && (
        <span className="text-[10px] text-emerald-700 flex items-center gap-0.5 font-medium" title={message}>
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span className="truncate max-w-[120px]">{message}</span>
        </span>
      )}

      {status === 'error' && (
        <span className="text-[10px] text-rose-700 flex items-center gap-0.5 font-medium" title={message}>
          <AlertCircle className="w-3 h-3 text-rose-600" />
          <span className="truncate max-w-[120px]">{message}</span>
        </span>
      )}
    </div>
  );
}
