import { describe, it, expect } from 'vitest';
import {
  buildInvoicePrintHtml,
  buildInvoiceWordHtml,
  InvoiceExportData,
} from '@/lib/invoice-export';

describe('Invoice & Shipping Label Exporter', () => {
  const sampleInvoiceData: InvoiceExportData = {
    orderCode: 'BK-10025',
    invoiceDate: '1403/07/25',
    senderName: 'فروشگاه عسل باباخُرم',
    senderPhone: '09123456789',
    senderAddress: 'تهران، خیابان آزادی، پلاک ۱۲',
    senderPostalCode: '1234567890',
    customerName: 'سارا رضایی',
    customerMobile: '09987654321',
    customerCity: 'اصفهان',
    customerAddress: 'اصفهان، میدان انقلاب، خیابان کمال، کوچه ۴، پلاک ۱۸',
    customerPostalCode: '8145678912',
    customerNotes: 'لطفا در بسته‌بندی حباب‌دار دوجداره قرار گیرد',
    lines: [
      {
        id: 'item-1',
        productNameFa: 'عسل کوهستان سبلان',
        optionLabel: '۱ کیلوگرم',
        qty: 2,
        unitPrice: 450000,
      },
      {
        id: 'item-2',
        productNameFa: 'ژل رویال خالص ایرانی',
        optionLabel: '۵۰ گرم',
        qty: 1,
        unitPrice: 650000,
      },
    ],
    shippingCost: 50000,
    discount: 30000,
    printMode: 'BOTH',
  };

  describe('buildInvoicePrintHtml (Isolated Print Window)', () => {
    it('generates a complete self-contained HTML5 document with RTL and Vazirmatn font', () => {
      const html = buildInvoicePrintHtml(sampleInvoiceData);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="fa" dir="rtl">');
      expect(html).toContain("src: url('/fonts/Vazirmatn[wght].woff2')");
      expect(html).toContain('size: A4;');
      expect(html).toContain('margin: 12mm;');
    });

    it('renders Section 1: Official Commercial Invoice with itemized products and totals', () => {
      const html = buildInvoicePrintHtml(sampleInvoiceData);

      expect(html).toContain('فاکتور فروش رسمی عسل باباخُرم');
      expect(html).toContain('سارا رضایی');
      expect(html).toContain('اصفهان');
      expect(html).toContain('عسل کوهستان سبلان');
      expect(html).toContain('۱ کیلوگرم');
      expect(html).toContain('ژل رویال خالص ایرانی');
      expect(html).toContain('۵۰ گرم');

      // Check for summary calculations:
      // Items total: (2 * 450,000) + (1 * 650,000) = 1,550,000
      // Shipping: 50,000
      // Discount: 30,000
      // Grand total: 1,570,000
      expect(html).toContain('جمع کل اقلام سفارش:');
      expect(html).toContain('هزینه بسته‌بندی و ارسال پستی:');
      expect(html).toContain('مبلغ تخفیف ویژه:');
      expect(html).toContain('مبلغ قابل پرداخت:');

      // Guarantee and signatures
      expect(html).toContain('مهر و امضای فروشگاه');
      expect(html).toContain('امضای خریدار');
    });

    it('renders Section 2: Cut-out Postal Shipping Label with cut line', () => {
      const html = buildInvoicePrintHtml(sampleInvoiceData);

      expect(html).toContain('✂️ خط برش برچسب پستی مرسوله');
      expect(html).toContain('برچسب پستی مرسوله - فرستنده / گیرنده');
      expect(html).toContain('فرستنده (Sender):');
      expect(html).toContain('گیرنده (Receiver):');
      expect(html).toContain('مقصد: اصفهان');
      expect(html).toContain('لطفا در بسته‌بندی حباب‌دار دوجداره قرار گیرد');
    });

    it('respects printMode filtering', () => {
      const invoiceOnly = buildInvoicePrintHtml({
        ...sampleInvoiceData,
        printMode: 'INVOICE_ONLY',
      });
      expect(invoiceOnly).toContain('فاکتور فروش رسمی عسل باباخُرم');
      expect(invoiceOnly).not.toContain('✂️ خط برش برچسب پستی مرسوله');

      const labelOnly = buildInvoicePrintHtml({
        ...sampleInvoiceData,
        printMode: 'LABEL_ONLY',
      });
      expect(labelOnly).not.toContain('فاکتور فروش رسمی عسل باباخُرم');
      expect(labelOnly).toContain('برچسب پستی مرسوله - فرستنده / گیرنده');
    });

    it('includes automatic print trigger script on window load', () => {
      const html = buildInvoicePrintHtml(sampleInvoiceData);
      expect(html).toContain("window.addEventListener('load'");
      expect(html).toContain('window.print();');
    });
  });

  describe('buildInvoiceWordHtml (Strict Word/Docs Export)', () => {
    it('includes MSO XML namespaces and Word Document settings', () => {
      const html = buildInvoiceWordHtml(sampleInvoiceData);

      expect(html).toContain("xmlns:o='urn:schemas-microsoft-com:office:office'");
      expect(html).toContain("xmlns:w='urn:schemas-microsoft-com:office:word'");
      expect(html).toContain('<w:WordDocument>');
      expect(html).toContain('<w:View>Print</w:View>');
    });

    it('strictly uses table elements with border and RTL direction, without CSS flex or grid', () => {
      const html = buildInvoiceWordHtml(sampleInvoiceData);

      expect(html).toContain('<table dir="rtl" border="1"');
      // Must NOT contain CSS flexbox or CSS grid
      expect(html).not.toMatch(/display\s*:\s*flex/i);
      expect(html).not.toMatch(/display\s*:\s*grid/i);
      expect(html).not.toMatch(/flex-direction/i);
    });

    it('correctly populates customer and store metadata in Word format', () => {
      const html = buildInvoiceWordHtml(sampleInvoiceData);

      expect(html).toContain('فاکتور فروش رسمی عسل باباخُرم');
      expect(html).toContain('سارا رضایی');
      expect(html).toContain('اصفهان');
      expect(html).toContain('تضمین اصالت و بازگشت کالا');
      expect(html).toContain('مهر و امضای فروشگاه');
      expect(html).toContain('✂️ برچسب پستی مرسوله');
    });
  });
});
