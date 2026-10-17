/**
 * Invoice & Shipping Label HTML/Word Generators
 * Provides rock-solid, isolated HTML generation for:
 * 1. Standalone Print/PDF Popup Window (A4, Vazirmatn font, clean print styles)
 * 2. Strict Microsoft Word / Google Docs Export (table-only, MSO namespaces, zero flex/grid)
 */

import { toPersianDigits } from '@/lib/domain-utils';

export interface InvoiceLineItem {
  id: string;
  productNameFa: string;
  optionLabel: string;
  qty: number;
  unitPrice: number;
}

export interface InvoiceExportData {
  orderCode: string;
  invoiceDate: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  senderPostalCode: string;
  customerName: string;
  customerMobile: string;
  customerCity?: string | null;
  customerAddress?: string | null;
  customerPostalCode?: string | null;
  customerNotes?: string | null;
  lines: InvoiceLineItem[];
  shippingCost?: number;
  discount?: number;
  printMode?: 'BOTH' | 'LABEL_ONLY' | 'INVOICE_ONLY';
}

function formatToman(amount: number): string {
  if (isNaN(amount) || !isFinite(amount)) return '۰';
  const rounded = Math.round(amount);
  const formatted = rounded.toLocaleString('fa-IR');
  return toPersianDigits(formatted);
}

/**
 * Builds a complete self-contained HTML5 document for isolated popup print
 */
export function buildInvoicePrintHtml(data: InvoiceExportData): string {
  const {
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
    shippingCost = 0,
    discount = 0,
    printMode = 'BOTH',
  } = data;

  const itemsTotal = lines.reduce((acc, curr) => acc + curr.qty * (curr.unitPrice || 0), 0);
  const grandTotal = Math.max(0, itemsTotal + shippingCost - discount);
  const totalItemCount = lines.reduce((acc, curr) => acc + curr.qty, 0);

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>فاکتور فروش رسمی شماره ${toPersianDigits(orderCode)} - عسل باباخُرم</title>
  <style>
    @font-face {
      font-family: 'Vazirmatn';
      src: url('/fonts/Vazirmatn[wght].woff2') format('woff2');
      font-weight: 100 900;
      font-style: normal;
      font-display: swap;
    }
    @page {
      size: A4;
      margin: 12mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Vazirmatn', Tahoma, 'B Nazanin', Arial, sans-serif;
      direction: rtl;
      text-align: right;
      color: #2B2017;
      background: #ffffff;
      padding: 8px;
      font-size: 10pt;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      direction: rtl;
      text-align: right;
      font-family: 'Vazirmatn', Tahoma, Arial, sans-serif;
    }
    .header-box {
      border: 2px solid #2B2017;
      padding: 12px;
      margin-bottom: 12px;
    }
    .meta-table td {
      border: 1px solid #2B2017;
      padding: 6px 10px;
      font-size: 9.5pt;
      background-color: #FAF7F2;
    }
    .items-table {
      margin: 14px 0;
      border: 1px solid #2B2017;
    }
    .items-table th {
      background-color: #F5EEDF !important;
      border: 1px solid #2B2017;
      padding: 7px 8px;
      font-size: 9.5pt;
      font-weight: bold;
      text-align: center;
    }
    .items-table td {
      border: 1px solid #2B2017;
      padding: 6px 8px;
      font-size: 9.5pt;
    }
    .row-even {
      background-color: #ffffff;
    }
    .row-odd {
      background-color: #FAF7F2;
    }
    .text-center { text-align: center; }
    .text-left { text-align: left; direction: ltr; }
    .text-right { text-align: right; }
    .total-row {
      background-color: #FDE8CD !important;
      font-weight: bold;
      font-size: 11pt;
      color: #B45309;
    }
    .cut-line {
      margin: 22px 0 16px 0;
      border-top: 2px dashed #78716C;
      text-align: center;
      position: relative;
    }
    .cut-line span {
      background: #ffffff;
      padding: 0 14px;
      font-size: 9pt;
      font-weight: bold;
      color: #78716C;
      position: relative;
      top: -11px;
    }
    .shipping-box {
      border: 2px solid #2B2017;
      padding: 12px;
      margin-top: 10px;
    }
    .signature-table td {
      border: 1px solid #2B2017;
      padding: 10px;
      text-align: center;
      height: 80px;
      vertical-align: top;
      font-size: 9.5pt;
    }
  </style>
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 350);
    });
  </script>
</head>
<body>
  ${(printMode === 'BOTH' || printMode === 'INVOICE_ONLY') ? `
  <!-- Section 1: Official Commercial Invoice -->
  <div class="header-box">
    <table style="margin-bottom: 10px;">
      <tr>
        <td style="width: 65%; vertical-align: top;">
          <h1 style="font-size: 16pt; font-weight: 900; color: #B45309; margin: 0 0 4px 0;">
            🍯 فاکتور فروش رسمی عسل باباخُرم
          </h1>
          <p style="font-size: 10pt; color: #332115; font-weight: bold; margin: 0 0 4px 0;">
            تولید و عرضه مستقیم انواع عسل‌های طبیعی و ارگانیک کوهستان، ژل رویال و گرده گل
          </p>
          <p style="font-size: 9pt; color: #5C5248; margin: 0;">
            نشانی فروشگاه: ${senderAddress} | تلفن تماس: ${toPersianDigits(senderPhone)}
          </p>
        </td>
        <td style="width: 35%; vertical-align: top;">
          <table class="meta-table" style="width: 100%;">
            <tr>
              <td style="font-weight: bold;">شماره فاکتور:</td>
              <td style="font-family: monospace; font-weight: bold; color: #B45309;">${toPersianDigits(orderCode)}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">تاریخ صدور:</td>
              <td>${toPersianDigits(invoiceDate)}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">کد رهگیری:</td>
              <td style="font-family: monospace; font-weight: bold;">${toPersianDigits(orderCode)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Customer Details Table -->
    <table class="meta-table" style="width: 100%; margin-top: 8px;">
      <tr>
        <td style="width: 50%;"><strong>نام خریدار / تحویل‌گیرنده: </strong>${customerName || 'مشتری گرامی'}</td>
        <td style="width: 50%;"><strong>شماره تلفن همراه: </strong><span style="font-family: monospace; font-weight: bold;">${toPersianDigits(customerMobile)}</span></td>
      </tr>
      <tr>
        <td><strong>شهر / استان مقصد: </strong>${customerCity || '—'}</td>
        <td><strong>کد پستی گیرنده: </strong><span style="font-family: monospace;">${customerPostalCode ? toPersianDigits(customerPostalCode) : '—'}</span></td>
      </tr>
      <tr>
        <td colspan="2"><strong>نشانی دقیق پستی: </strong>${customerAddress || 'ثبت نشده (هماهنگی تلفنی)'}</td>
      </tr>
      ${customerNotes ? `
      <tr>
        <td colspan="2"><strong>یادداشت و توضیحات ارسال: </strong>${customerNotes}</td>
      </tr>` : ''}
    </table>

    <!-- Itemized Products Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 40px;">ردیف</th>
          <th style="text-align: right;">شرح محصول و وزن</th>
          <th style="width: 60px;">تعداد</th>
          <th style="width: 120px;">فی (تومان)</th>
          <th style="width: 130px;">مبلغ کل (تومان)</th>
        </tr>
      </thead>
      <tbody>
        ${lines.map((line, idx) => `
        <tr class="${idx % 2 === 0 ? 'row-even' : 'row-odd'}">
          <td class="text-center" style="font-family: monospace;">${toPersianDigits(idx + 1)}</td>
          <td>
            <strong>${line.productNameFa}</strong>
            ${line.optionLabel ? ` <span style="font-size: 8.5pt; color: #5C5248;">(${line.optionLabel})</span>` : ''}
          </td>
          <td class="text-center" style="font-family: monospace; font-weight: bold;">${toPersianDigits(line.qty)}</td>
          <td class="text-left" style="font-family: monospace;">${formatToman(line.unitPrice || 0)}</td>
          <td class="text-left" style="font-family: monospace; font-weight: bold;">${formatToman(line.qty * (line.unitPrice || 0))}</td>
        </tr>
        `).join('')}

        <!-- Summary Rows -->
        <tr style="background-color: #FAF7F2;">
          <td colspan="3" class="text-right" style="font-weight: bold;">جمع کل اقلام سفارش:</td>
          <td colspan="2" class="text-left" style="font-family: monospace; font-weight: bold;">${formatToman(itemsTotal)} تومان</td>
        </tr>
        ${shippingCost > 0 ? `
        <tr>
          <td colspan="3" class="text-right">هزینه بسته‌بندی و ارسال پستی:</td>
          <td colspan="2" class="text-left" style="font-family: monospace;">${formatToman(shippingCost)} تومان</td>
        </tr>` : ''}
        ${discount > 0 ? `
        <tr style="color: #166534;">
          <td colspan="3" class="text-right" style="font-weight: bold;">مبلغ تخفیف ویژه:</td>
          <td colspan="2" class="text-left" style="font-family: monospace; font-weight: bold;">- ${formatToman(discount)} تومان</td>
        </tr>` : ''}
        <tr class="total-row">
          <td colspan="3" class="text-right" style="font-size: 11pt;">مبلغ قابل پرداخت:</td>
          <td colspan="2" class="text-left" style="font-family: monospace; font-size: 12pt;">${formatToman(grandTotal)} تومان</td>
        </tr>
      </tbody>
    </table>

    <!-- Guarantee & Signatures Table -->
    <table class="signature-table" style="width: 100%; margin-top: 14px;">
      <tr>
        <td style="width: 60%; text-align: right; vertical-align: top; font-size: 8.5pt; color: #5C5248; background-color: #FAF7F2;">
          <strong style="color: #2B2017; font-size: 9.5pt;">ضمانت اصالت و بازگشت کالا:</strong><br/>
          تمامی محصولات عسل باباخُرم دارای ضمانت اصالت ۱۰۰٪ آزمایشگاهی و طبیعی می‌باشند.<br/>
          در صورت هرگونه نارضایتی، مرسوله تا ۷ روز کاری پس از تحویل قابل عودت کامل می‌باشد.<br/>
          تلفن پشتیبانی: ${toPersianDigits(senderPhone)} | وب‌سایت: عسل طبیعی باباخُرم
        </td>
        <td style="width: 20%; vertical-align: top;">
          <strong>مهر و امضای فروشگاه</strong><br/><br/>
          <span style="font-size: 9pt; color: #5C5248;">عسل طبیعی باباخُرم</span>
        </td>
        <td style="width: 20%; vertical-align: top;">
          <strong>امضای خریدار</strong><br/><br/>
          <span style="font-size: 8.5pt; color: #78716C;">تحویل صحیح و سالم مرسوله</span>
        </td>
      </tr>
    </table>
  </div>
  ` : ''}

  ${printMode === 'BOTH' ? `
  <!-- Section 2 Divider: Cut line -->
  <div class="cut-line">
    <span>✂️ خط برش برچسب پستی مرسوله</span>
  </div>
  ` : ''}

  ${(printMode === 'BOTH' || printMode === 'LABEL_ONLY') ? `
  <!-- Section 2: Postal Shipping Label -->
  <div class="shipping-box">
    <table style="width: 100%; border: 2px solid #2B2017; margin-bottom: 8px;">
      <tr>
        <td style="padding: 6px 12px; background-color: #332115; color: #FFFFFF; font-weight: bold; font-size: 10.5pt;">
          برچسب پستی مرسوله - فرستنده / گیرنده (پیشتاز و سفارشی)
        </td>
        <td style="padding: 6px 12px; background-color: #332115; color: #FBBF24; font-family: monospace; font-weight: bold; text-align: left; font-size: 10.5pt;">
          کد رهگیری: ${toPersianDigits(orderCode)}
        </td>
      </tr>
    </table>

    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <!-- Sender Box -->
        <td style="width: 40%; vertical-align: top; border: 1.5px solid #2B2017; padding: 10px; background-color: #FAF7F2;">
          <div style="font-weight: bold; border-bottom: 1px solid #D5C7B8; padding-bottom: 4px; margin-bottom: 6px; color: #B45309; font-size: 10pt;">
            فرستنده (Sender):
          </div>
          <p style="margin: 3px 0; font-weight: bold; font-size: 10pt;">${senderName}</p>
          <p style="margin: 3px 0; font-size: 9pt;"><strong>تلفن: </strong>${toPersianDigits(senderPhone)}</p>
          <p style="margin: 3px 0; font-size: 9pt;"><strong>نشانی: </strong>${senderAddress}</p>
          <p style="margin: 3px 0; font-size: 9pt;"><strong>کد پستی: </strong><span style="font-family: monospace;">${toPersianDigits(senderPostalCode)}</span></p>
        </td>

        <!-- Receiver Box -->
        <td style="width: 60%; vertical-align: top; border: 2px solid #2B2017; padding: 10px; background-color: #FFFFFF;">
          <div style="font-weight: bold; border-bottom: 2px solid #2B2017; padding-bottom: 4px; margin-bottom: 6px; font-size: 10.5pt;">
            <span>گیرنده (Receiver):</span>
            ${customerCity ? `<span style="background: #2B2017; color: #FFFFFF; padding: 1px 6px; font-size: 9pt; float: left;">مقصد: ${customerCity}</span>` : ''}
          </div>
          <p style="margin: 4px 0; font-size: 11pt;"><strong>نام گیرنده: </strong><span style="font-weight: 900;">${customerName || 'مشتری گرامی'}</span></p>
          <p style="margin: 4px 0; font-size: 11pt;"><strong>تلفن همراه: </strong><span style="font-family: monospace; font-weight: 900;">${toPersianDigits(customerMobile)}</span></p>
          <p style="margin: 4px 0; font-size: 10pt;"><strong>نشانی دقیق تحویل: </strong>${customerAddress || 'ثبت نشده (هماهنگی تلفنی)'}</p>
          ${customerPostalCode ? `<p style="margin: 4px 0; font-size: 10pt;"><strong>کد پستی گیرنده: </strong><span style="font-family: monospace; font-weight: bold;">${toPersianDigits(customerPostalCode)}</span></p>` : ''}
          ${customerNotes ? `<p style="margin: 4px 0; font-size: 9pt; color: #5C5248; border-top: 1px dashed #D5C7B8; padding-top: 4px;"><strong>یادداشت ارسال: </strong>${customerNotes}</p>` : ''}
        </td>
      </tr>
    </table>

    <table style="width: 100%; margin-top: 8px; border-top: 1px solid #2B2017; padding-top: 6px; font-size: 8.5pt;">
      <tr>
        <td style="width: 50%;"><strong>تعداد کل اقلام داخل مرسوله: </strong>${toPersianDigits(totalItemCount)} بسته</td>
        <td style="width: 50%; text-align: left;"><strong>تاریخ آماده‌سازی و ارسال: </strong>${toPersianDigits(invoiceDate)}</td>
      </tr>
    </table>
  </div>
  ` : ''}
</body>
</html>`;
}

/**
 * Builds strict Word-compatible HTML using ONLY table elements with inline styling.
 * Guaranteed zero CSS flexbox, zero CSS grid, and zero Tailwind classes!
 */
export function buildInvoiceWordHtml(data: InvoiceExportData): string {
  const {
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
    shippingCost = 0,
    discount = 0,
  } = data;

  const itemsTotal = lines.reduce((acc, curr) => acc + curr.qty * (curr.unitPrice || 0), 0);
  const grandTotal = Math.max(0, itemsTotal + shippingCost - discount);
  const totalItemCount = lines.reduce((acc, curr) => acc + curr.qty, 0);

  return `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40' dir='rtl' lang='fa'>
<head>
  <meta charset='utf-8'>
  <title>فاکتور فروش رسمی شماره ${orderCode} - عسل باباخُرم</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page Section1 {
      size: 595.3pt 841.9pt;
      margin: 1.5cm 1.5cm 1.5cm 1.5cm;
      mso-header-margin: 36.0pt;
      mso-footer-margin: 36.0pt;
      mso-paper-source: 0;
    }
    div.Section1 { page: Section1; }
    body {
      font-family: Tahoma, Vazirmatn, Arial, sans-serif;
      direction: rtl;
      text-align: right;
      color: #2B2017;
      background: #ffffff;
      margin: 20px;
    }
  </style>
</head>
<body>
<div class="Section1">
  <!-- Table 1: Header Table -->
  <table dir="rtl" border="1" cellspacing="0" cellpadding="8" style="width:100%; border-collapse:collapse; font-family: Tahoma, Vazirmatn, Arial, sans-serif; direction: rtl; text-align: right; margin-bottom: 16px; border: 2px solid #2B2017;">
    <tr>
      <td style="width:65%; vertical-align:top; border: 1px solid #2B2017; font-family: Tahoma, Vazirmatn, Arial, sans-serif; direction: rtl; text-align: right;">
        <p style="font-size: 16pt; font-weight: bold; color: #B45309; margin: 0 0 6px 0;">فاکتور فروش رسمی عسل باباخُرم</p>
        <p style="font-size: 10pt; color: #5C5248; margin: 0 0 4px 0;">تولید و عرضه مستقیم انواع عسل‌های طبیعی و ارگانیک، ژل رویال و گرده گل</p>
        <p style="font-size: 9.5pt; color: #2B2017; margin: 0;"><strong>نشانی: </strong>${senderAddress} | <strong>تلفن: </strong>${toPersianDigits(senderPhone)}</p>
      </td>
      <td style="width:35%; vertical-align:top; background-color:#FAF7F2; border: 1px solid #2B2017; font-family: Tahoma, Vazirmatn, Arial, sans-serif; direction: rtl; text-align: right;">
        <p style="margin:2px 0; font-size:10pt;"><strong>شماره فاکتور: </strong>${toPersianDigits(orderCode)}</p>
        <p style="margin:2px 0; font-size:10pt;"><strong>تاریخ صدور: </strong>${toPersianDigits(invoiceDate)}</p>
        <p style="margin:2px 0; font-size:10pt;"><strong>کد رهگیری: </strong>${toPersianDigits(orderCode)}</p>
      </td>
    </tr>
  </table>

  <!-- Table 2: Customer Details Table -->
  <table dir="rtl" border="1" cellspacing="0" cellpadding="8" style="width:100%; border-collapse:collapse; font-family: Tahoma, Vazirmatn, Arial, sans-serif; direction: rtl; text-align: right; margin-bottom: 16px; border: 1px solid #2B2017;">
    <tr>
      <td style="width:50%; border: 1px solid #2B2017; font-family: Tahoma, Vazirmatn, Arial, sans-serif; direction: rtl; text-align: right; background-color:#FAF7F2;">
        <strong>نام خریدار / گیرنده: </strong>${customerName || 'مشتری گرامی'}
      </td>
      <td style="width:50%; border: 1px solid #2B2017; font-family: Tahoma, Vazirmatn, Arial, sans-serif; direction: rtl; text-align: right; background-color:#FAF7F2;">
        <strong>شماره تماس گیرنده: </strong>${toPersianDigits(customerMobile)}
      </td>
    </tr>
    <tr>
      <td style="width:50%; border: 1px solid #2B2017; font-family: Tahoma, Vazirmatn, Arial, sans-serif; direction: rtl; text-align: right;">
        <strong>شهر / استان مقصد: </strong>${customerCity || '—'}
      </td>
      <td style="width:50%; border: 1px solid #2B2017; font-family: Tahoma, Vazirmatn, Arial, sans-serif; direction: rtl; text-align: right;">
        <strong>کد پستی گیرنده: </strong>${customerPostalCode ? toPersianDigits(customerPostalCode) : '—'}
      </td>
    </tr>
    <tr>
      <td colspan="2" style="border: 1px solid #2B2017; font-family: Tahoma, Vazirmatn, Arial, sans-serif; direction: rtl; text-align: right;">
        <strong>نشانی دقیق تحویل: </strong>${customerAddress || 'ثبت نشده (هماهنگی تلفنی)'}
      </td>
    </tr>
    ${customerNotes ? `
    <tr>
      <td colspan="2" style="border: 1px solid #2B2017; font-family: Tahoma, Vazirmatn, Arial, sans-serif; direction: rtl; text-align: right;">
        <strong>یادداشت ارسال: </strong>${customerNotes}
      </td>
    </tr>` : ''}
  </table>

  <!-- Table 3: Itemized Products Table -->
  <table dir="rtl" border="1" cellspacing="0" cellpadding="8" style="width:100%; border-collapse:collapse; font-family: Tahoma, Vazirmatn, Arial, sans-serif; direction: rtl; text-align: right; margin-bottom: 16px; border: 1px solid #2B2017;">
    <thead>
      <tr>
        <th style="width:40px; border: 1px solid #2B2017; background-color:#F5EEDF; text-align:center; font-family: Tahoma, Vazirmatn, Arial, sans-serif; font-weight:bold;">ردیف</th>
        <th style="border: 1px solid #2B2017; background-color:#F5EEDF; text-align:right; font-family: Tahoma, Vazirmatn, Arial, sans-serif; font-weight:bold;">شرح محصول و وزن</th>
        <th style="width:60px; border: 1px solid #2B2017; background-color:#F5EEDF; text-align:center; font-family: Tahoma, Vazirmatn, Arial, sans-serif; font-weight:bold;">تعداد</th>
        <th style="width:120px; border: 1px solid #2B2017; background-color:#F5EEDF; text-align:left; font-family: Tahoma, Vazirmatn, Arial, sans-serif; font-weight:bold;">فی (تومان)</th>
        <th style="width:130px; border: 1px solid #2B2017; background-color:#F5EEDF; text-align:left; font-family: Tahoma, Vazirmatn, Arial, sans-serif; font-weight:bold;">مبلغ کل (تومان)</th>
      </tr>
    </thead>
    <tbody>
      ${lines.map((line, idx) => `
      <tr style="background-color: ${idx % 2 === 0 ? '#FFFFFF' : '#FAF7F2'};">
        <td style="border: 1px solid #2B2017; text-align:center; font-family: Tahoma, Vazirmatn, Arial, sans-serif;">${toPersianDigits(idx + 1)}</td>
        <td style="border: 1px solid #2B2017; text-align:right; font-family: Tahoma, Vazirmatn, Arial, sans-serif;">
          <strong>${line.productNameFa}</strong>
          ${line.optionLabel ? ` (${line.optionLabel})` : ''}
        </td>
        <td style="border: 1px solid #2B2017; text-align:center; font-family: Tahoma, Vazirmatn, Arial, sans-serif; font-weight:bold;">${toPersianDigits(line.qty)}</td>
        <td style="border: 1px solid #2B2017; text-align:left; font-family: Tahoma, Vazirmatn, Arial, sans-serif;">${formatToman(line.unitPrice || 0)}</td>
        <td style="border: 1px solid #2B2017; text-align:left; font-family: Tahoma, Vazirmatn, Arial, sans-serif; font-weight:bold;">${formatToman(line.qty * (line.unitPrice || 0))}</td>
      </tr>
      `).join('')}

      <tr style="background-color: #FAF7F2;">
        <td colspan="3" style="border: 1px solid #2B2017; text-align:right; font-weight:bold; font-family: Tahoma, Vazirmatn, Arial, sans-serif;">جمع کل اقلام سفارش:</td>
        <td colspan="2" style="border: 1px solid #2B2017; text-align:left; font-weight:bold; font-family: Tahoma, Vazirmatn, Arial, sans-serif;">${formatToman(itemsTotal)} تومان</td>
      </tr>
      ${shippingCost > 0 ? `
      <tr>
        <td colspan="3" style="border: 1px solid #2B2017; text-align:right; font-family: Tahoma, Vazirmatn, Arial, sans-serif;">هزینه بسته‌بندی و ارسال پستی:</td>
        <td colspan="2" style="border: 1px solid #2B2017; text-align:left; font-family: Tahoma, Vazirmatn, Arial, sans-serif;">${formatToman(shippingCost)} تومان</td>
      </tr>` : ''}
      ${discount > 0 ? `
      <tr style="color: #166534;">
        <td colspan="3" style="border: 1px solid #2B2017; text-align:right; font-weight:bold; font-family: Tahoma, Vazirmatn, Arial, sans-serif;">مبلغ تخفیف ویژه:</td>
        <td colspan="2" style="border: 1px solid #2B2017; text-align:left; font-weight:bold; font-family: Tahoma, Vazirmatn, Arial, sans-serif;">- ${formatToman(discount)} تومان</td>
      </tr>` : ''}
      <tr style="background-color: #FDE8CD; color: #B45309; font-weight:bold;">
        <td colspan="3" style="border: 2px solid #2B2017; text-align:right; font-size:11pt; font-family: Tahoma, Vazirmatn, Arial, sans-serif;">مبلغ نهایی قابل پرداخت:</td>
        <td colspan="2" style="border: 2px solid #2B2017; text-align:left; font-size:12pt; font-family: Tahoma, Vazirmatn, Arial, sans-serif;">${formatToman(grandTotal)} تومان</td>
      </tr>
    </tbody>
  </table>

  <!-- Table 4: Guarantee & Signatures Table -->
  <table dir="rtl" border="1" cellspacing="0" cellpadding="8" style="width:100%; border-collapse:collapse; font-family: Tahoma, Vazirmatn, Arial, sans-serif; direction: rtl; text-align: right; margin-top: 16px; border: 1px solid #2B2017;">
    <tr>
      <td style="width:60%; border: 1px solid #2B2017; font-family: Tahoma, Vazirmatn, Arial, sans-serif; direction: rtl; text-align: right; vertical-align: top; font-size: 9pt; color: #5C5248; background-color: #FAF7F2;">
        <strong style="color: #2B2017; font-size: 10pt;">تضمین اصالت و بازگشت کالا:</strong><br/>
        تمامی محصولات عسل باباخُرم دارای ضمانت اصالت ۱۰۰٪ آزمایشگاهی و طبیعی می‌باشند.<br/>
        در صورت هرگونه نارضایتی، مرسوله ظرف مدت ۷ روز کاری قابل عودت کامل می‌باشد.<br/>
        پشتیبانی و سفارشات: ${toPersianDigits(senderPhone)} | وب‌سایت: عسل طبیعی باباخُرم
      </td>
      <td style="width:20%; border: 1px solid #2B2017; font-family: Tahoma, Vazirmatn, Arial, sans-serif; text-align: center; vertical-align: top; height: 80px;">
        <strong style="font-size: 9.5pt;">مهر و امضای فروشگاه</strong><br/><br/>
        <span style="font-size: 9pt; color: #5C5248;">عسل طبیعی باباخُرم</span>
      </td>
      <td style="width:20%; border: 1px solid #2B2017; font-family: Tahoma, Vazirmatn, Arial, sans-serif; text-align: center; vertical-align: top; height: 80px;">
        <strong style="font-size: 9.5pt;">امضای خریدار</strong><br/><br/>
        <span style="font-size: 9pt; color: #5C5248;">تحویل صحیح و سالم مرسوله</span>
      </td>
    </tr>
  </table>

  <!-- Table 5: Cut-out Postal Shipping Label for Word -->
  <table dir="rtl" border="1" cellspacing="0" cellpadding="8" style="width:100%; border-collapse:collapse; font-family: Tahoma, Vazirmatn, Arial, sans-serif; direction: rtl; text-align: right; margin-top: 30px; border: 2px dashed #78716C;">
    <tr>
      <td colspan="2" style="background-color: #FAF7F2; border: 1px solid #78716C; font-family: Tahoma, Vazirmatn, Arial, sans-serif; text-align: center; font-weight: bold; font-size: 10.5pt; color: #B45309;">
        ✂️ برچسب پستی مرسوله (فرستنده و گیرنده) - کد رهگیری: ${toPersianDigits(orderCode)}
      </td>
    </tr>
    <tr>
      <td style="width:40%; border: 1px solid #78716C; font-family: Tahoma, Vazirmatn, Arial, sans-serif; vertical-align: top;">
        <p style="margin: 2px 0; font-weight: bold; color: #B45309;">فرستنده:</p>
        <p style="margin: 2px 0;"><strong>${senderName}</strong></p>
        <p style="margin: 2px 0;"><strong>تلفن: </strong>${toPersianDigits(senderPhone)}</p>
        <p style="margin: 2px 0;"><strong>نشانی: </strong>${senderAddress}</p>
        <p style="margin: 2px 0;"><strong>کد پستی: </strong>${toPersianDigits(senderPostalCode)}</p>
      </td>
      <td style="width:60%; border: 1px solid #78716C; font-family: Tahoma, Vazirmatn, Arial, sans-serif; vertical-align: top;">
        <p style="margin: 2px 0; font-weight: bold; color: #2B2017;">گیرنده:</p>
        <p style="margin: 2px 0; font-size: 11pt;"><strong>نام گیرنده: </strong>${customerName || 'مشتری گرامی'}</p>
        <p style="margin: 2px 0; font-size: 11pt;"><strong>شماره تماس: </strong>${toPersianDigits(customerMobile)}</p>
        <p style="margin: 2px 0;"><strong>شهر مقصد: </strong>${customerCity || '—'}</p>
        <p style="margin: 2px 0;"><strong>نشانی تحویل: </strong>${customerAddress || 'ثبت نشده'}</p>
        ${customerPostalCode ? `<p style="margin: 2px 0;"><strong>کد پستی: </strong>${toPersianDigits(customerPostalCode)}</p>` : ''}
        ${customerNotes ? `<p style="margin: 2px 0; font-size: 9pt;"><strong>یادداشت ارسال: </strong>${customerNotes}</p>` : ''}
      </td>
    </tr>
    <tr>
      <td style="border: 1px solid #78716C; font-family: Tahoma, Vazirmatn, Arial, sans-serif; font-size: 9pt;">
        <strong>تعداد کل اقلام داخل مرسوله: </strong>${toPersianDigits(totalItemCount)} بسته
      </td>
      <td style="border: 1px solid #78716C; font-family: Tahoma, Vazirmatn, Arial, sans-serif; font-size: 9pt; text-align: left;">
        <strong>تاریخ ارسال: </strong>${toPersianDigits(invoiceDate)}
      </td>
    </tr>
  </table>
</div>
</body>
</html>`;
}
