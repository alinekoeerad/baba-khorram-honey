'use client';

/**
 * OrderPrintModal
 * Fully editable printable invoice & shipping label modal for the admin panel.
 * Generates postal shipping labels (A5/A6) and official sales invoices with inline editing,
 * sharp 90-degree corners (rounded-none), and clean print layout.
 */

import React, { useState } from 'react';
import {
  Printer,
  X,
  Plus,
  Trash2,
  Package,
  MapPin,
  Phone,
  User,
  FileText,
  DollarSign,
  Truck,
  CheckCircle2,
  RotateCcw,
  FileDown,
} from 'lucide-react';
import { toPersianDigits, parseLocalizedNumber } from '@/lib/domain-utils';
import type { OrderItem } from './orders-manager-client';
import { buildInvoicePrintHtml, buildInvoiceWordHtml } from '@/lib/invoice-export';

interface EditableLineItem {
  id: string;
  productNameFa: string;
  optionLabel: string;
  qty: number;
  unitPrice: number;
}

interface OrderPrintModalProps {
  order: OrderItem;
  isOpen: boolean;
  onClose: () => void;
}

type PrintMode = 'BOTH' | 'LABEL_ONLY' | 'INVOICE_ONLY';

function formatToman(amount: number): string {
  if (isNaN(amount) || !isFinite(amount)) return '۰';
  const rounded = Math.round(amount);
  const formatted = rounded.toLocaleString('fa-IR');
  return toPersianDigits(formatted);
}

function formatDateToPersian(dateInput: string | Date): string {
  try {
    const d = new Date(dateInput);
    return new Intl.DateTimeFormat('fa-IR', {
      dateStyle: 'medium',
    }).format(d);
  } catch {
    return String(dateInput);
  }
}

export function OrderPrintModal({ order, isOpen, onClose }: OrderPrintModalProps) {
  // Mode selection
  const [printMode, setPrintMode] = useState<PrintMode>('BOTH');

  // Customer / Recipient state
  const [customerName, setCustomerName] = useState(order.customerName || '');
  const [customerMobile, setCustomerMobile] = useState(order.customerMobile || '');
  const [customerCity, setCustomerCity] = useState(order.customerCity || '');
  const [customerAddress, setCustomerAddress] = useState(order.customerAddress || '');
  const [customerPostalCode, setCustomerPostalCode] = useState('');
  const [customerNotes, setCustomerNotes] = useState(order.customerNotes || '');

  // Sender state
  const [senderName, setSenderName] = useState('عسل باباخُرم');
  const [senderPhone, setSenderPhone] = useState('۰۲۶-۳۴۴۵۵۶۶۷ | ۰۹۱۲۳۴۵۶۷۸۹');
  const [senderAddress, setSenderAddress] = useState('کرج، جهانشهر، بلوار مولانا');
  const [senderPostalCode, setSenderPostalCode] = useState('۳۱۴۸۵-۱۴۳۲۱');

  // Invoice specifics
  const [orderCode, setOrderCode] = useState(order.code);
  const [invoiceDate, setInvoiceDate] = useState(() => formatDateToPersian(order.createdAt));
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);

  // Line items state
  const [lines, setLines] = useState<EditableLineItem[]>(() => {
    return order.lines.map((l, idx) => ({
      id: `${l.productId || 'p'}_${idx}`,
      productNameFa: l.productNameFa || 'عسل طبیعی',
      optionLabel: l.optionLabel || '',
      qty: l.qty || 1,
      unitPrice: l.unitPrice || 0,
    }));
  });

  if (!isOpen) return null;

  // Computations
  const itemsTotal = lines.reduce((acc, curr) => acc + (curr.qty * (curr.unitPrice || 0)), 0);
  const grandTotal = Math.max(0, itemsTotal + (shippingCost || 0) - (discount || 0));
  const totalItemCount = lines.reduce((acc, curr) => acc + curr.qty, 0);

  const handleAddLine = () => {
    setLines((prev) => [
      ...prev,
      {
        id: `custom_${Date.now()}`,
        productNameFa: 'عسل طبیعی کوهستان',
        optionLabel: '۱ کیلوگرم',
        qty: 1,
        unitPrice: 0,
      },
    ]);
  };

  const handleUpdateLine = (id: string, updates: Partial<EditableLineItem>) => {
    setLines((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleRemoveLine = (id: string) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((item) => item.id !== id));
  };

  const handleResetToOriginal = () => {
    setCustomerName(order.customerName || '');
    setCustomerMobile(order.customerMobile || '');
    setCustomerCity(order.customerCity || '');
    setCustomerAddress(order.customerAddress || '');
    setCustomerPostalCode('');
    setCustomerNotes(order.customerNotes || '');
    setOrderCode(order.code);
    setInvoiceDate(formatDateToPersian(order.createdAt));
    setShippingCost(0);
    setDiscount(0);
    setSenderName('عسل باباخُرم');
    setSenderPhone('۰۲۶-۳۴۴۵۵۶۶۷ | ۰۹۱۲۳۴۵۶۷۸۹');
    setSenderAddress('کرج، جهانشهر، بلوار مولانا');
    setSenderPostalCode('۳۱۴۸۵-۱۴۳۲۱');
    setLines(
      order.lines.map((l, idx) => ({
        id: `${l.productId || 'p'}_${idx}`,
        productNameFa: l.productNameFa || 'عسل طبیعی',
        optionLabel: l.optionLabel || '',
        qty: l.qty || 1,
        unitPrice: l.unitPrice || 0,
      }))
    );
  };

  const handlePrint = () => {
    const printWin = window.open('', '_blank', 'width=900,height=900');
    if (!printWin) {
      alert('لطفاً اجازه باز شدن پنجره پاپ‌آپ چاپ را در مرورگر فعال کنید.');
      return;
    }
    const fullInvoiceHtml = buildInvoicePrintHtml({
      orderCode,
      invoiceDate,
      senderName,
      senderPhone,
      senderAddress,
      senderPostalCode,
      customerName,
      customerMobile,
      customerCity,
      customerAddress,
      customerPostalCode,
      customerNotes,
      lines,
      shippingCost,
      discount,
      printMode,
    });
    printWin.document.open();
    printWin.document.write(fullInvoiceHtml);
    printWin.document.close();
  };

  const handleExportWord = () => {
    const content = buildInvoiceWordHtml({
      orderCode,
      invoiceDate,
      senderName,
      senderPhone,
      senderAddress,
      senderPostalCode,
      customerName,
      customerMobile,
      customerCity,
      customerAddress,
      customerPostalCode,
      customerNotes,
      lines,
      shippingCost,
      discount,
    });
    const blob = new Blob(['\ufeff' + content], {
      type: 'application/msword;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `فاکتور-رسمی-عسل-باباخرم-${orderCode}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Screen Modal Overlay */}
      <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
        <div className="bg-[#FAF7F2] border-2 border-[#D97706] w-full max-w-7xl max-h-[92vh] flex flex-col rounded-none shadow-2xl overflow-hidden">
          {/* Header Bar */}
          <div className="p-4 bg-white border-b border-[#EFE9E0] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-[#D97706]" />
              <div>
                <h3 className="font-bold text-[#2B2017] text-sm sm:text-base">
                  چاپ فاکتور و برچسب پستی مرسوله
                </h3>
                <p className="text-xs text-stone-500">
                  سفارش <span className="font-mono font-bold text-[#D97706]">{order.code}</span> — امکان ویرایش آنلاین تمام مقادیر پیش از چاپ
                </p>
              </div>
            </div>

            {/* Mode selection + Print CTA */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center border border-[#EFE9E0] bg-[#FAF7F2] p-0.5">
                <button
                  type="button"
                  onClick={() => setPrintMode('BOTH')}
                  className={`px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer rounded-none ${
                    printMode === 'BOTH'
                      ? 'bg-[#332115] text-white'
                      : 'text-[#5C5248] hover:text-[#2B2017]'
                  }`}
                >
                  برچسب و فاکتور
                </button>
                <button
                  type="button"
                  onClick={() => setPrintMode('LABEL_ONLY')}
                  className={`px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer rounded-none ${
                    printMode === 'LABEL_ONLY'
                      ? 'bg-[#332115] text-white'
                      : 'text-[#5C5248] hover:text-[#2B2017]'
                  }`}
                >
                  فقط برچسب پستی
                </button>
                <button
                  type="button"
                  onClick={() => setPrintMode('INVOICE_ONLY')}
                  className={`px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer rounded-none ${
                    printMode === 'INVOICE_ONLY'
                      ? 'bg-[#332115] text-white'
                      : 'text-[#5C5248] hover:text-[#2B2017]'
                  }`}
                >
                  فقط فاکتور فروش
                </button>
              </div>

              <button
                type="button"
                onClick={handleResetToOriginal}
                className="h-9 px-3 bg-white hover:bg-stone-100 border border-[#EFE9E0] text-xs font-bold text-[#5C5248] transition-colors inline-flex items-center gap-1.5 cursor-pointer rounded-none"
                title="بازنشانی اطلاعات به مقادیر اولیه سفارش"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">بازنشانی</span>
              </button>

              <button
                type="button"
                onClick={handleExportWord}
                className="h-9 px-3 bg-white hover:bg-amber-50 border border-[#D97706] text-[#D97706] hover:text-[#B45309] text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer rounded-none"
                title="دانلود فایل Word (.doc)"
              >
                <FileDown className="w-4 h-4" />
                <span>دانلود فایل Word (.doc)</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="h-9 px-4 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-black transition-colors inline-flex items-center gap-2 shadow-xs cursor-pointer rounded-none"
                title="چاپ فاکتور رسمی (Print / PDF)"
              >
                <Printer className="w-4 h-4" />
                <span>چاپ فاکتور رسمی (Print / PDF)</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="h-9 w-9 flex items-center justify-center text-stone-400 hover:text-stone-700 bg-white border border-[#EFE9E0] transition-colors cursor-pointer rounded-none"
                aria-label="بستن پنجره"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Body: Split View (Edit Controls on Left/First, Live Preview on Right/Second) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#FAF7F2]">
            {/* Column 1: Editable Fields Panel (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white border border-[#EFE9E0] p-4 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#EFE9E0] pb-2">
                  <h4 className="font-bold text-xs text-[#2B2017] flex items-center gap-1.5">
                    <User className="w-4 h-4 text-[#D97706]" />
                    <span>مشخصات گیرنده (مشتری)</span>
                  </h4>
                  <span className="text-[11px] text-stone-400 font-mono">
                    کد: {orderCode}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#5C5248] mb-1">
                      نام و نام خانوادگی تحویل‌گیرنده:
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full h-8 px-2.5 bg-[#FAF7F2] border border-[#EFE9E0] text-xs text-[#2B2017] rounded-none focus:outline-none focus:border-[#D97706]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-[#5C5248] mb-1">
                        تلفن تماس گیرنده:
                      </label>
                      <input
                        type="text"
                        value={customerMobile}
                        onChange={(e) => setCustomerMobile(e.target.value)}
                        className="w-full h-8 px-2.5 bg-[#FAF7F2] border border-[#EFE9E0] text-xs font-mono text-[#2B2017] rounded-none focus:outline-none focus:border-[#D97706]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#5C5248] mb-1">
                        شهر / استان مقصد:
                      </label>
                      <input
                        type="text"
                        value={customerCity}
                        onChange={(e) => setCustomerCity(e.target.value)}
                        placeholder="مثال: تهران"
                        className="w-full h-8 px-2.5 bg-[#FAF7F2] border border-[#EFE9E0] text-xs text-[#2B2017] rounded-none focus:outline-none focus:border-[#D97706]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#5C5248] mb-1">
                      کد پستی گیرنده (۱۰ رقمی):
                    </label>
                    <input
                      type="text"
                      value={customerPostalCode}
                      onChange={(e) => setCustomerPostalCode(e.target.value)}
                      placeholder="اختیاری یا ۱۰ رقم"
                      className="w-full h-8 px-2.5 bg-[#FAF7F2] border border-[#EFE9E0] text-xs font-mono text-[#2B2017] rounded-none focus:outline-none focus:border-[#D97706]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#5C5248] mb-1">
                      نشانی کامل پستی:
                    </label>
                    <textarea
                      rows={2}
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="w-full p-2 bg-[#FAF7F2] border border-[#EFE9E0] text-xs text-[#2B2017] rounded-none focus:outline-none focus:border-[#D97706]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#5C5248] mb-1">
                      توضیحات و یادداشت تحویل:
                    </label>
                    <input
                      type="text"
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      placeholder="مثال: تماس قبل از مراجعه / با احتیاط حمل شود"
                      className="w-full h-8 px-2.5 bg-[#FAF7F2] border border-[#EFE9E0] text-xs text-[#2B2017] rounded-none focus:outline-none focus:border-[#D97706]"
                    />
                  </div>
                </div>
              </div>

              {/* Line Items Editor */}
              <div className="bg-white border border-[#EFE9E0] p-4 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#EFE9E0] pb-2">
                  <h4 className="font-bold text-xs text-[#2B2017] flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-[#D97706]" />
                    <span>اقلام سفارش و قیمت‌ها</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-[11px] font-bold text-[#D97706] hover:text-[#B45309] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن قلم کالا</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {lines.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3 bg-[#FAF7F2] border border-[#EFE9E0] space-y-2 relative"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-stone-500">
                          قلم {toPersianDigits(idx + 1)}
                        </span>
                        {lines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(item.id)}
                            className="text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="حذف این قلم"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-stone-500 mb-0.5">
                            نام محصول:
                          </label>
                          <input
                            type="text"
                            value={item.productNameFa}
                            onChange={(e) =>
                              handleUpdateLine(item.id, { productNameFa: e.target.value })
                            }
                            className="w-full h-7 px-2 bg-white border border-[#EFE9E0] text-xs text-[#2B2017] rounded-none focus:outline-none focus:border-[#D97706]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-stone-500 mb-0.5">
                            بسته‌بندی / وزن:
                          </label>
                          <input
                            type="text"
                            value={item.optionLabel}
                            onChange={(e) =>
                              handleUpdateLine(item.id, { optionLabel: e.target.value })
                            }
                            className="w-full h-7 px-2 bg-white border border-[#EFE9E0] text-xs text-[#2B2017] rounded-none focus:outline-none focus:border-[#D97706]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-stone-500 mb-0.5">
                            تعداد:
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                              handleUpdateLine(item.id, { qty: val });
                            }}
                            className="w-full h-7 px-2 bg-white border border-[#EFE9E0] text-xs font-mono text-[#2B2017] rounded-none focus:outline-none focus:border-[#D97706]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-stone-500 mb-0.5">
                            قیمت واحد (تومان):
                          </label>
                          <input
                            type="text"
                            value={item.unitPrice ? item.unitPrice.toLocaleString('fa-IR') : ''}
                            onChange={(e) => {
                              const val = parseLocalizedNumber(e.target.value) || 0;
                              handleUpdateLine(item.id, { unitPrice: val });
                            }}
                            placeholder="۰"
                            className="w-full h-7 px-2 bg-white border border-[#EFE9E0] text-xs font-mono text-[#2B2017] rounded-none focus:outline-none focus:border-[#D97706]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping & Financial Controls */}
              <div className="bg-white border border-[#EFE9E0] p-4 shadow-xs space-y-3">
                <h4 className="font-bold text-xs text-[#2B2017] border-b border-[#EFE9E0] pb-2 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-[#D97706]" />
                  <span>هزینه‌ها و محاسبات نهایی</span>
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#5C5248] mb-1">
                      هزینه ارسال پستی (تومان):
                    </label>
                    <input
                      type="text"
                      value={shippingCost ? shippingCost.toLocaleString('fa-IR') : ''}
                      onChange={(e) => {
                        const val = parseLocalizedNumber(e.target.value) || 0;
                        setShippingCost(val);
                      }}
                      placeholder="۰ (رایگان)"
                      className="w-full h-8 px-2.5 bg-[#FAF7F2] border border-[#EFE9E0] text-xs font-mono text-[#2B2017] rounded-none focus:outline-none focus:border-[#D97706]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#5C5248] mb-1">
                      مبلغ تخفیف (تومان):
                    </label>
                    <input
                      type="text"
                      value={discount ? discount.toLocaleString('fa-IR') : ''}
                      onChange={(e) => {
                        const val = parseLocalizedNumber(e.target.value) || 0;
                        setDiscount(val);
                      }}
                      placeholder="۰"
                      className="w-full h-8 px-2.5 bg-[#FAF7F2] border border-[#EFE9E0] text-xs font-mono text-[#2B2017] rounded-none focus:outline-none focus:border-[#D97706]"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-[#EFE9E0] flex items-center justify-between text-xs">
                  <span className="font-bold text-[#5C5248]">مجموع نهایی فاکتور:</span>
                  <span className="font-mono font-black text-sm text-[#D97706]">
                    {formatToman(grandTotal)} تومان
                  </span>
                </div>
              </div>

              {/* Sender Details */}
              <div className="bg-white border border-[#EFE9E0] p-4 shadow-xs space-y-3">
                <h4 className="font-bold text-xs text-[#2B2017] border-b border-[#EFE9E0] pb-2 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#D97706]" />
                  <span>مشخصات فرستنده (برچسب پستی)</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-stone-500 mb-0.5">نام فرستنده:</label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full h-7 px-2 bg-[#FAF7F2] border border-[#EFE9E0] text-xs text-[#2B2017] rounded-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-stone-500 mb-0.5">تلفن فرستنده:</label>
                    <input
                      type="text"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      className="w-full h-7 px-2 bg-[#FAF7F2] border border-[#EFE9E0] text-xs font-mono text-[#2B2017] rounded-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-stone-500 mb-0.5">نشانی فرستنده:</label>
                    <input
                      type="text"
                      value={senderAddress}
                      onChange={(e) => setSenderAddress(e.target.value)}
                      className="w-full h-7 px-2 bg-[#FAF7F2] border border-[#EFE9E0] text-xs text-[#2B2017] rounded-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Live Screen Preview of the Print Sheet (7 cols) */}
            <div className="lg:col-span-7">
              <div className="sticky top-0 bg-white border border-stone-300 shadow-md p-6 sm:p-8 space-y-8 rounded-none">
                <div className="border-b border-stone-200 pb-3 flex items-center justify-between text-xs text-stone-400">
                  <span className="font-bold text-[#2B2017]">
                    پیش‌نمایش زنده چاپی (صفحه چاپ)
                  </span>
                  <span>اندازه استاندارد A4 / A5</span>
                </div>

                {/* Printable Root Area (this exact element will be printed) */}
                <div id="printable-order-sheet" className="space-y-8 text-black bg-white">
                  {/* SECTION 1: POSTAL SHIPPING LABEL */}
                  {(printMode === 'BOTH' || printMode === 'LABEL_ONLY') && (
                    <div className="border-2 border-black p-4 space-y-3 font-sans">
                      {/* Label Header */}
                      <div className="flex items-center justify-between border-b-2 border-black pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🍯</span>
                          <div>
                            <div className="font-black text-base tracking-tight">
                              عسل طبیعی باباخُرم
                            </div>
                            <div className="text-[11px] text-stone-700">
                              برچسب ارسال مرسوله پستی / باربری
                            </div>
                          </div>
                        </div>

                        <div className="text-left font-mono">
                          <div className="text-xs font-bold text-stone-600">کد رهگیری سفارش:</div>
                          <div className="font-black text-lg tracking-wider border border-black px-2 py-0.5">
                            {orderCode}
                          </div>
                        </div>
                      </div>

                      {/* Sender & Receiver Boxes */}
                      <div className="grid grid-cols-12 gap-3 text-xs leading-relaxed">
                        {/* Sender Box (4 cols) */}
                        <div className="col-span-5 border border-black p-2.5 space-y-1 bg-stone-50">
                          <div className="font-black text-[11px] border-b border-stone-300 pb-1 text-stone-700">
                            فرستنده (Sender):
                          </div>
                          <div className="font-bold text-black">{senderName}</div>
                          <div className="text-[11px] text-stone-800">{senderAddress}</div>
                          <div className="text-[11px] pt-1 font-mono">
                            <span className="font-bold">تلفن: </span>
                            {toPersianDigits(senderPhone)}
                          </div>
                          {senderPostalCode && (
                            <div className="text-[11px] font-mono">
                              <span className="font-bold">کد پستی: </span>
                              {toPersianDigits(senderPostalCode)}
                            </div>
                          )}
                        </div>

                        {/* Receiver Box (7 cols, larger font) */}
                        <div className="col-span-7 border-2 border-black p-3 space-y-1.5 bg-white">
                          <div className="font-black text-xs border-b border-black pb-1 flex items-center justify-between">
                            <span className="text-black">گیرنده (Receiver):</span>
                            {customerCity && (
                              <span className="text-[11px] bg-black text-white px-1.5 py-0.2 font-bold">
                                مقصد: {customerCity}
                              </span>
                            )}
                          </div>

                          <div className="flex items-baseline gap-2">
                            <span className="text-xs text-stone-600">نام گیرنده:</span>
                            <span className="font-black text-sm text-black">
                              {customerName || 'مشتری گرامی'}
                            </span>
                          </div>

                          <div className="flex items-baseline gap-2">
                            <span className="text-xs text-stone-600">شماره تماس:</span>
                            <span className="font-black text-base font-mono tracking-wider text-black">
                              {toPersianDigits(customerMobile)}
                            </span>
                          </div>

                          <div className="pt-1">
                            <span className="text-xs text-stone-600 font-bold">نشانی تحویل: </span>
                            <span className="font-bold text-xs text-black">
                              {customerAddress || 'ثبت نشده (هماهنگی تلفنی)'}
                            </span>
                          </div>

                          {customerPostalCode && (
                            <div className="pt-0.5 text-xs font-mono">
                              <span className="font-bold">کد پستی گیرنده: </span>
                              <span className="font-bold tracking-widest">
                                {toPersianDigits(customerPostalCode)}
                              </span>
                            </div>
                          )}

                          {customerNotes && (
                            <div className="text-[11px] pt-1 text-stone-800 border-t border-stone-300">
                              <span className="font-bold">یادداشت ارسال: </span>
                              {customerNotes}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Package Meta Footer */}
                      <div className="flex items-center justify-between border-t border-black pt-2 text-[11px]">
                        <div>
                          <span className="font-bold">تعداد کل اقلام داخل مرسوله: </span>
                          <span className="font-mono font-black">{toPersianDigits(totalItemCount)} بسته</span>
                        </div>
                        <div>
                          <span className="font-bold">تاریخ ارسال: </span>
                          <span className="font-mono">{toPersianDigits(invoiceDate)}</span>
                        </div>
                        <div className="font-mono text-stone-500 text-[10px]">
                          Baba Khorram Honey - Verified Packaging
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Page break when printing both */}
                  {printMode === 'BOTH' && (
                    <div className="print-break-page border-b-2 border-dashed border-stone-300 my-6 no-print text-center text-xs text-stone-400">
                      --- مرز تفکیک برگه برچسب و فاکتور فروش (در چاپ هر کدام در صفحه مجزا می‌افتد) ---
                    </div>
                  )}

                  {/* SECTION 2: OFFICIAL SALES INVOICE */}
                  {(printMode === 'BOTH' || printMode === 'INVOICE_ONLY') && (
                    <div className="border border-black p-5 space-y-4 font-sans">
                      {/* Invoice Header */}
                      <div className="border-b-2 border-black pb-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">🍯</span>
                              <h2 className="text-xl font-black tracking-tight text-black">
                                عسل باباخُرم
                              </h2>
                            </div>
                            <p className="text-xs text-stone-700 font-bold">
                              صورتحساب رسمی فروش کالا و خدمات
                            </p>
                          </div>

                          <div className="border border-black px-3 py-1.5 bg-stone-50 text-left text-xs space-y-0.5 font-mono">
                            <div>
                              <span className="text-stone-600 font-bold">شماره فاکتور: </span>
                              <span className="font-black text-sm text-[#D97706]">{orderCode}</span>
                            </div>
                            <div>
                              <span className="text-stone-600 font-bold">تاریخ صدور: </span>
                              <span className="font-bold">{toPersianDigits(invoiceDate)}</span>
                            </div>
                            <div>
                              <span className="text-stone-600 font-bold">کد رهگیری: </span>
                              <span className="font-bold">{orderCode}</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-800">
                          <div className="font-bold">
                            عسل باباخُرم - کرج، جهانشهر، بلوار مولانا | تلفن: <span className="font-mono">{toPersianDigits(senderPhone)}</span>
                          </div>
                          <div className="text-[11px] text-stone-500">
                            تولید و عرضه مستقیم انواع عسل‌های طبیعی و ارگانیک
                          </div>
                        </div>
                      </div>

                      {/* Customer Details Box */}
                      <div className="bg-stone-50 border border-black p-3 grid grid-cols-12 gap-2 text-xs">
                        <div className="col-span-6 sm:col-span-3">
                          <span className="text-stone-600 font-bold">نام خریدار: </span>
                          <strong className="text-black">{customerName || 'مشتری گرامی'}</strong>
                        </div>
                        <div className="col-span-6 sm:col-span-3 font-mono">
                          <span className="text-stone-600 font-bold">تلفن همراه: </span>
                          <strong>{toPersianDigits(customerMobile)}</strong>
                        </div>
                        <div className="col-span-6 sm:col-span-3">
                          <span className="text-stone-600 font-bold">شهر مقصد: </span>
                          <strong>{customerCity || '—'}</strong>
                        </div>
                        <div className="col-span-6 sm:col-span-3 font-mono">
                          <span className="text-stone-600 font-bold">کد رهگیری: </span>
                          <strong className="text-[#D97706]">{orderCode}</strong>
                        </div>
                        {customerAddress && (
                          <div className="col-span-12 pt-2 border-t border-stone-200">
                            <span className="text-stone-600 font-bold">نشانی دقیق تحویل: </span>
                            <span className="text-black">{customerAddress}</span>
                          </div>
                        )}
                        {customerPostalCode && (
                          <div className="col-span-12 font-mono">
                            <span className="text-stone-600 font-bold">کد پستی: </span>
                            <span>{toPersianDigits(customerPostalCode)}</span>
                          </div>
                        )}
                        {customerNotes && (
                          <div className="col-span-12 text-stone-700 pt-1 border-t border-stone-200">
                            <span className="font-bold">یادداشت ارسال: </span>
                            <span>{customerNotes}</span>
                          </div>
                        )}
                      </div>

                      {/* Items Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse border border-black">
                          <thead>
                            <tr className="bg-stone-100 text-black border-b border-black font-black text-center">
                              <th className="border border-black p-1.5 w-10">ردیف</th>
                              <th className="border border-black p-1.5 text-right">شرح کالا / محصول</th>
                              <th className="border border-black p-1.5 w-24">بسته‌بندی</th>
                              <th className="border border-black p-1.5 w-16">تعداد</th>
                              <th className="border border-black p-1.5 w-28 text-left">قیمت واحد (تومان)</th>
                              <th className="border border-black p-1.5 w-32 text-left">مبلغ کل (تومان)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lines.map((line, idx) => {
                              const lineTotal = line.qty * (line.unitPrice || 0);
                              return (
                                <tr key={line.id} className="border-b border-black">
                                  <td className="border border-black p-1.5 text-center font-mono">
                                    {toPersianDigits(idx + 1)}
                                  </td>
                                  <td className="border border-black p-1.5 font-bold text-black text-right">
                                    {line.productNameFa}
                                  </td>
                                  <td className="border border-black p-1.5 text-center text-stone-700">
                                    {line.optionLabel || '—'}
                                  </td>
                                  <td className="border border-black p-1.5 text-center font-mono font-bold">
                                    {toPersianDigits(line.qty)}
                                  </td>
                                  <td className="border border-black p-1.5 text-left font-mono">
                                    {formatToman(line.unitPrice || 0)}
                                  </td>
                                  <td className="border border-black p-1.5 text-left font-mono font-bold">
                                    {formatToman(lineTotal)}
                                  </td>
                                </tr>
                              );
                            })}

                            {/* Summary Rows */}
                            <tr className="border-t border-black bg-stone-50">
                              <td colSpan={4} className="border border-black p-1.5 text-right font-bold">
                                جمع کل اقلام:
                              </td>
                              <td colSpan={2} className="border border-black p-1.5 text-left font-mono font-bold">
                                {formatToman(itemsTotal)} تومان
                              </td>
                            </tr>

                            {shippingCost > 0 && (
                              <tr>
                                <td colSpan={4} className="border border-black p-1.5 text-right text-stone-700">
                                  هزینه بسته‌بندی و ارسال پستی:
                                </td>
                                <td colSpan={2} className="border border-black p-1.5 text-left font-mono">
                                  {formatToman(shippingCost)} تومان
                                </td>
                              </tr>
                            )}

                            {discount > 0 && (
                              <tr>
                                <td colSpan={4} className="border border-black p-1.5 text-right text-emerald-800">
                                  مبلغ تخفیف ویژه:
                                </td>
                                <td colSpan={2} className="border border-black p-1.5 text-left font-mono text-emerald-800 font-bold">
                                  - {formatToman(discount)} تومان
                                </td>
                              </tr>
                            )}

                            <tr className="bg-stone-200 text-black font-black text-sm">
                              <td colSpan={4} className="border-2 border-black p-2 text-right">
                                مبلغ نهایی قابل پرداخت:
                              </td>
                              <td colSpan={2} className="border-2 border-black p-2 text-left font-mono text-base">
                                {formatToman(grandTotal)} تومان
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Guarantee Notes and Signature Box */}
                      <div className="grid grid-cols-12 gap-4 pt-3 border-t border-stone-300 text-xs">
                        <div className="col-span-8 space-y-1 text-stone-700">
                          <div className="font-bold text-black">
                            تضمین و شرایط عودت:
                          </div>
                          <p className="text-[11px] leading-relaxed">
                            تمامی عسل‌های باباخُرم دارای ضمانت اصالت ۱۰۰٪ آزمایشگاهی و طبیعی می‌باشند.
                            در صورت هرگونه نارضایتی، مرسوله ظرف مدت ۷ روز کاری قابل عودت کامل می‌باشد.
                          </p>
                          <div className="text-[10px] text-stone-500 pt-1">
                            پشتیبانی و سفارشات: {toPersianDigits(senderPhone)} | وب‌سایت: عسل باباخُرم
                          </div>
                        </div>

                        <div className="col-span-4 border border-black p-3 text-center space-y-8 min-h-[90px]">
                          <div className="font-bold text-[11px] text-stone-600">
                            مهر و امضای فروشگاه
                          </div>
                          <div className="text-[10px] text-stone-400">
                            عسل طبیعی باباخُرم
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Modal Bottom Action Footer */}
          <div className="p-3 bg-white border-t border-[#EFE9E0] flex items-center justify-between gap-3 text-xs">
            <span className="text-stone-500">
              💡 نکته: در صفحه چاپ مرورگر، تیک «Background graphics» را فعال بگذارید تا خطوط جدول و کادرها با وضوح بالا چاپ شوند.
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 bg-[#FAF7F2] hover:bg-stone-100 border border-[#EFE9E0] font-bold text-[#5C5248] transition-colors cursor-pointer rounded-none"
              >
                انصراف و بستن
              </button>
              <button
                type="button"
                onClick={handleExportWord}
                className="h-9 px-3 bg-white hover:bg-amber-50 border border-[#D97706] text-[#D97706] hover:text-[#B45309] font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer rounded-none"
                title="دانلود فایل Word (.doc)"
              >
                <FileDown className="w-4 h-4" />
                <span>دانلود فایل Word (.doc)</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="h-9 px-5 bg-[#D97706] hover:bg-[#B45309] text-white font-black transition-colors inline-flex items-center gap-2 shadow-xs cursor-pointer rounded-none"
                title="چاپ فاکتور رسمی (Print / PDF)"
              >
                <Printer className="w-4 h-4" />
                <span>چاپ فاکتور رسمی (Print / PDF)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
