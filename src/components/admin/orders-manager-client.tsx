'use client';

/**
 * OrdersManagerClient
 * Interactive client table and card manager for orders in the admin panel.
 */

import React, { useState, useTransition } from 'react';
import {
  updateOrderStatusAction,
  deleteOrderAction,
} from '@/server/actions/order-actions';
import { copyTextSync, copyTextToClipboard } from '@/lib/clipboard';
import { toPersianDigits, normalizeDigits } from '@/lib/domain-utils';
import {
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  Copy,
  Check,
  Search,
  Trash2,
  MessageSquare,
  Send,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Package,
  MapPin,
  FileText,
  Printer,
} from 'lucide-react';
import { useToast } from '@/components/admin/toast-provider';
import { ConfirmModal } from '@/components/admin/confirm-modal';
import { OrderPrintModal } from '@/components/admin/order-print-modal';

export interface OrderItem {
  id: string;
  code: string;
  customerName: string;
  customerMobile: string;
  customerCity?: string | null;
  customerAddress?: string | null;
  customerNotes?: string | null;
  preferredContact?: string | null;
  lines: Array<{
    productId: string;
    productNameFa: string;
    optionId: string;
    optionLabel: string;
    qty: number;
    unitPrice?: number | null;
  }>;
  totalPrice?: number | null;
  messageText: string;
  status: 'NEW' | 'CONTACTED' | 'SHIPPED' | 'CANCELLED';
  channelType?: string | null;
  channelValue?: string | null;
  createdAt: string | Date;
}

const STATUS_METAS: Record<
  string,
  { label: string; badgeCls: string; icon: React.ComponentType<{ className?: string }> }
> = {
  NEW: {
    label: 'جدید (در انتظار هماهنگی)',
    badgeCls: 'bg-rose-50 text-rose-700 border-rose-300 ring-1 ring-rose-200',
    icon: Clock,
  },
  CONTACTED: {
    label: 'هماهنگ شده',
    badgeCls: 'bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-200',
    icon: CheckCircle2,
  },
  SHIPPED: {
    label: 'ارسال شده',
    badgeCls: 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-200',
    icon: Truck,
  },
  CANCELLED: {
    label: 'لغو شده',
    badgeCls: 'bg-stone-100 text-stone-600 border-stone-300',
    icon: XCircle,
  },
};

const PREFERRED_CONTACT_MAP: Record<string, { label: string; cls: string }> = {
  PHONE: { label: 'تماس تلفنی / پیامک', cls: 'bg-amber-50 text-amber-900 border-amber-200' },
  EITAA: { label: 'ایتا (Eitaa)', cls: 'bg-orange-50 text-orange-900 border-orange-200' },
  BALE: { label: 'بله (Bale)', cls: 'bg-emerald-50 text-emerald-900 border-emerald-200' },
  WHATSAPP: { label: 'واتساپ (WhatsApp)', cls: 'bg-green-50 text-green-900 border-green-200' },
  TELEGRAM: { label: 'تلگرام (Telegram)', cls: 'bg-sky-50 text-sky-900 border-sky-200' },
};

function formatPersianDate(dateInput: string | Date): string {
  try {
    const d = new Date(dateInput);
    return new Intl.DateTimeFormat('fa-IR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return String(dateInput);
  }
}

export function OrdersManagerClient({
  initialOrders,
}: {
  initialOrders: OrderItem[];
}) {
  const toast = useToast();
  const [orders, setOrders] = useState<OrderItem[]>(initialOrders);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    id?: string;
    code?: string;
  }>({
    isOpen: false,
  });
  const [printModalOrder, setPrintModalOrder] = useState<OrderItem | null>(null);

  // Filter items
  const filtered = orders.filter((o) => {
    if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        o.code.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerMobile.includes(q) ||
        (o.customerAddress && o.customerAddress.toLowerCase().includes(q)) ||
        o.lines?.some(
          (l) =>
            l.productNameFa.toLowerCase().includes(q) ||
            l.optionLabel.toLowerCase().includes(q)
        );
      if (!match) return false;
    }
    return true;
  });

  const toggleExpand = (id: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleStatusChange = (
    id: string,
    newStatus: 'NEW' | 'CONTACTED' | 'SHIPPED' | 'CANCELLED'
  ) => {
    startTransition(async () => {
      const res = await updateOrderStatusAction(id, newStatus);
      if (res.success && res.order) {
        setOrders((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        );
        toast.success(
          `وضعیت سفارش به «${STATUS_METAS[newStatus]?.label || newStatus}» تغییر یافت.`,
          'وضعیت سفارش به‌روزرسانی شد'
        );
      } else {
        toast.error(res.error || 'عملیات با خطا مواجه شد.', 'خطا در تغییر وضعیت');
      }
    });
  };

  const handleCopyInvoice = (order: OrderItem) => {
    copyTextSync(order.messageText);
    copyTextToClipboard(order.messageText);
    setCopiedId(order.id);
    toast.success(
      `متن فاکتور سفارش ${order.code} در حافظه کپی گردید.`,
      'فاکتور کپی شد'
    );
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDelete = async () => {
    if (!confirmDelete.id) return;
    const orderId = confirmDelete.id;

    startTransition(async () => {
      const res = await deleteOrderAction(orderId);
      if (res.success) {
        setOrders((prev) => prev.filter((x) => x.id !== orderId));
        toast.success(
          `سفارش ${confirmDelete.code || ''} از سامانه پاک شد.`,
          'سفارش حذف شد'
        );
      } else {
        toast.error(res.error || 'خطا در حذف سفارش.', 'خطا در حذف');
      }
      setConfirmDelete({ isOpen: false });
    });
  };

  const counts = {
    all: orders.length,
    new: orders.filter((o) => o.status === 'NEW').length,
    contacted: orders.filter((o) => o.status === 'CONTACTED').length,
    shipped: orders.filter((o) => o.status === 'SHIPPED').length,
    cancelled: orders.filter((o) => o.status === 'CANCELLED').length,
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="bg-white border border-[#EFE9E0] p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute end-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="جستجو بر اساس کد سفارش، نام مشتری، شماره موبایل یا محصول..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pe-10 ps-3 bg-[#FAF7F2] border border-[#EFE9E0] text-xs text-[#2B2017] rounded-none focus:outline-none focus:border-[#D97706] focus:bg-white transition-colors"
            />
          </div>

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs text-stone-500 hover:text-stone-800 underline self-center cursor-pointer"
            >
              پاک کردن جستجو
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#EFE9E0] overflow-x-auto pb-1.5 sm:pb-0 sm:flex-wrap">
          <span className="text-xs font-bold text-[#5C5248] ms-1 shrink-0">وضعیت:</span>

          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-bold transition-all rounded-none cursor-pointer border whitespace-nowrap shrink-0 ${
              statusFilter === 'ALL'
                ? 'bg-[#332115] text-white border-[#332115] shadow-xs'
                : 'bg-white text-[#5C5248] border-[#EFE9E0] hover:bg-stone-50'
            }`}
          >
            همه ({toPersianDigits(counts.all)})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('NEW')}
            className={`px-3 py-1.5 text-xs font-bold transition-all rounded-none cursor-pointer border whitespace-nowrap shrink-0 ${
              statusFilter === 'NEW'
                ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
            }`}
          >
            جدید / در انتظار هماهنگی ({toPersianDigits(counts.new)})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('CONTACTED')}
            className={`px-3 py-1.5 text-xs font-bold transition-all rounded-none cursor-pointer border whitespace-nowrap shrink-0 ${
              statusFilter === 'CONTACTED'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
            }`}
          >
            هماهنگ شده ({toPersianDigits(counts.contacted)})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('SHIPPED')}
            className={`px-3 py-1.5 text-xs font-bold transition-all rounded-none cursor-pointer border whitespace-nowrap shrink-0 ${
              statusFilter === 'SHIPPED'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            ارسال شده ({toPersianDigits(counts.shipped)})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('CANCELLED')}
            className={`px-3 py-1.5 text-xs font-bold transition-all rounded-none cursor-pointer border whitespace-nowrap shrink-0 ${
              statusFilter === 'CANCELLED'
                ? 'bg-stone-600 text-white border-stone-600 shadow-xs'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            }`}
          >
            لغو شده ({toPersianDigits(counts.cancelled)})
          </button>
        </div>
      </div>

      {/* Orders List */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-[#EFE9E0] p-12 text-center text-[#5C5248] space-y-2 shadow-xs">
          <Package className="w-10 h-10 text-stone-300 mx-auto" />
          <p className="font-bold text-sm">هیچ سفارشی مطابق با فیلترهای انتخابی یافت نشد.</p>
          <p className="text-xs text-stone-400">
            می‌توانید عبارت جستجو را تغییر دهید یا فیلتر وضعیت را روی «همه» بگذارید.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => {
            const statusMeta = STATUS_METAS[order.status] || STATUS_METAS.NEW;
            const StatusIcon = statusMeta.icon;
            const isExpanded = expandedOrders[order.id];
            const cleanMobile = order.customerMobile.replace(/^0/, '');
            const prefContact =
              PREFERRED_CONTACT_MAP[order.preferredContact || 'PHONE'] ||
              PREFERRED_CONTACT_MAP.PHONE;

            return (
              <div
                key={order.id}
                className="bg-white border border-[#EFE9E0] shadow-xs rounded-none transition-shadow hover:shadow-md"
              >
                {/* Order Summary Header */}
                <div className="p-3.5 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#EFE9E0]">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono font-black text-base text-[#D97706] tracking-wider bg-[#FFFBEB] px-3 py-1 border border-[#FDE68A]">
                        {order.code}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 font-bold border rounded-none ${statusMeta.badgeCls}`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span>{statusMeta.label}</span>
                      </span>

                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 border rounded-none ${prefContact.cls}`}
                      >
                        روش ترجیحی: {prefContact.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#5C5248]">
                      <div>
                        <span>نام مشتری: </span>
                        <strong className="text-[#2B2017] text-sm">
                          {order.customerName || 'ثبت نشده'}
                        </strong>
                      </div>

                      <div className="flex items-center gap-1.5 font-mono text-sm text-[#2B2017]">
                        <Phone className="w-3.5 h-3.5 text-[#D97706]" />
                        <a
                          href={`tel:${normalizeDigits(order.customerMobile).replace(/[^0-9+]/g, '')}`}
                          className="hover:text-[#D97706] hover:underline"
                        >
                          {toPersianDigits(order.customerMobile)}
                        </a>
                      </div>

                      <div className="flex items-center gap-1 text-stone-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatPersianDate(order.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
                    {/* Status Dropdown */}
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-stone-400 hidden sm:inline">تغییر وضعیت:</span>
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(order.id, e.target.value as any)
                        }
                        disabled={isPending}
                        className="h-8 px-2.5 bg-[#FAF7F2] border border-[#EFE9E0] text-xs font-bold text-[#2B2017] focus:outline-none focus:border-[#D97706] rounded-none cursor-pointer"
                      >
                        <option value="NEW">جدید / در انتظار هماهنگی</option>
                        <option value="CONTACTED">هماهنگ شده</option>
                        <option value="SHIPPED">ارسال شده</option>
                        <option value="CANCELLED">لغو شده</option>
                      </select>
                    </div>

                    {/* Copy Invoice */}
                    <button
                      type="button"
                      onClick={() => handleCopyInvoice(order)}
                      className="h-8 px-3 inline-flex items-center gap-1.5 bg-[#FAF7F2] hover:bg-[#FEF3C7] border border-[#D97706] text-[#B45309] text-xs font-bold transition-colors cursor-pointer rounded-none"
                      title="کپی فاکتور سفارش"
                    >
                      {copiedId === order.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>کپی شد!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>کپی فاکتور</span>
                        </>
                      )}
                    </button>

                    {/* Print Invoice & Shipping Label */}
                    <button
                      type="button"
                      onClick={() => setPrintModalOrder(order)}
                      className="h-8 px-2.5 inline-flex items-center gap-1.5 bg-[#FAF7F2] hover:bg-stone-200 border border-[#EFE9E0] text-[#2B2017] text-xs font-bold transition-colors cursor-pointer rounded-none"
                      title="چاپ فاکتور و برچسب پستی مرسوله"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#D97706]" />
                      <span>چاپ فاکتور و برچسب پستی</span>
                    </button>

                    {/* Direct Contact Buttons */}
                    <a
                      href={`https://wa.me/98${cleanMobile}?text=${encodeURIComponent(
                        `سلام جناب ${order.customerName || ''} گرامی، سفارش شما در عسل باباخُرم با کد ${order.code} دریافت شد.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-8 px-2.5 inline-flex items-center gap-1 bg-[#25D366]/10 hover:bg-[#25D366] text-[#166534] hover:text-white border border-[#25D366]/30 text-xs font-bold transition-colors rounded-none"
                      title="ارسال پیام در واتساپ"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">واتساپ</span>
                    </a>

                    <a
                      href={`sms:${order.customerMobile}?body=${encodeURIComponent(
                        `سلام جناب ${order.customerName || ''} گرامی، سفارش شما با کد پیگیری ${order.code} در عسل باباخُرم دریافت شد.`
                      )}`}
                      className="h-8 px-2.5 inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-600 text-amber-900 hover:text-white border border-amber-200 text-xs font-bold transition-colors rounded-none"
                      title="ارسال پیامک"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">پیامک</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => toggleExpand(order.id)}
                      className="h-8 px-2.5 inline-flex items-center gap-1 bg-stone-100 hover:bg-stone-200 text-[#5C5248] text-xs font-bold transition-colors rounded-none cursor-pointer"
                      aria-label="جزئیات سفارش"
                    >
                      <span>{isExpanded ? 'بستن' : 'جزئیات'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setConfirmDelete({
                          isOpen: true,
                          id: order.id,
                          code: order.code,
                        })
                      }
                      className="h-8 px-2 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="حذف سفارش"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Collapsible Details Panel */}
                {isExpanded && (
                  <div className="p-5 bg-[#FFFDF9] space-y-4 border-t border-[#EFE9E0] text-xs animate-in fade-in duration-150">
                    {/* Address / Notes Card */}
                    {(order.customerAddress || order.customerNotes) && (
                      <div className="p-3 bg-[#FAF7F2] border border-[#EFE9E0] space-y-1.5">
                        {order.customerAddress && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-[#2B2017]">نشانی تحویل: </strong>
                              <span className="text-[#5C5248]">{order.customerAddress}</span>
                            </div>
                          </div>
                        )}
                        {order.customerNotes && (
                          <div className="flex items-start gap-2 pt-1 border-t border-[#EFE9E0]">
                            <FileText className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-[#2B2017]">توضیحات مشتری: </strong>
                              <span className="text-[#5C5248]">{order.customerNotes}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Ordered Items Table */}
                    <div className="space-y-2">
                      <div className="font-bold text-sm text-[#2B2017] flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-[#D97706]" />
                        <span>اقلام سفارش:</span>
                      </div>
                      <div className="divide-y divide-[#EFE9E0] border border-[#EFE9E0] bg-white">
                        {order.lines.map((line, idx) => (
                          <div
                            key={idx}
                            className="p-3 flex items-center justify-between text-xs sm:text-sm"
                          >
                            <span className="font-bold text-[#2B2017]">
                              {line.productNameFa}{' '}
                              <span className="text-stone-400 font-normal">
                                ({line.optionLabel})
                              </span>
                            </span>
                            <span className="font-mono font-black text-[#B45309]">
                              {toPersianDigits(line.qty)} عدد
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Full Invoice Pre block */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between text-xs text-stone-500">
                        <span className="font-bold text-[#2B2017]">
                          متن فاکتور سفارش:
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setPrintModalOrder(order)}
                            className="text-[#D97706] hover:text-[#B45309] hover:underline font-bold cursor-pointer inline-flex items-center gap-1"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>چاپ فاکتور و برچسب پستی (Print / Word)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyInvoice(order)}
                            className="text-stone-500 hover:text-[#2B2017] hover:underline cursor-pointer"
                          >
                            کپی متن
                          </button>
                        </div>
                      </div>
                      <pre className="p-3.5 bg-white border border-[#EFE9E0] font-sans text-xs text-[#2B2017] leading-relaxed whitespace-pre-wrap select-all">
                        {order.messageText}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="حذف سفارش"
        message={`آیا از حذف سفارش شماره «${confirmDelete.code || ''}» اطمینان دارید؟ این عملیات غیرقابل بازگشت است.`}
        confirmLabel="بله، حذف کن"
        cancelLabel="انصراف"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete({ isOpen: false })}
        isLoading={isPending}
      />

      {/* Editable Printable Invoice & Shipping Label Modal */}
      {printModalOrder && (
        <OrderPrintModal
          order={printModalOrder}
          isOpen={Boolean(printModalOrder)}
          onClose={() => setPrintModalOrder(null)}
        />
      )}
    </div>
  );
}
