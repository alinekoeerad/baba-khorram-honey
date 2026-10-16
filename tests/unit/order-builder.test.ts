import { describe, it, expect } from 'vitest';
import {
  generateOrderReferenceCode,
  buildFullOrderMessage,
  buildCompactOrderMessage,
  buildChannelOrderLink,
  sanitizePlainText,
} from '@/lib/order-builder';

describe('Order Message Builders & Link Patterns (Phase 9 Task 6/10 & Addendum A5/A6)', () => {
  const sampleData = {
    referenceCode: 'A7K3-92',
    customer: {
      firstName: 'علی',
      lastName: 'رضایی',
      mobile: '09123456789',
      province: 'آذربایجان شرقی',
      city: 'تبریز',
      address: 'خیابان شریعتی جنوبی، کوچه بهار، پلاک ۱۲',
      postalCode: '5133612345',
      notes: 'لطفاً بعد از ظهر تحویل داده شود.',
    },
    items: [
      { productNameFa: 'عسل گون کوهستان', optionLabel: '۱ کیلوگرم', qty: 2 },
      { productNameFa: 'عسل آویشن طبیعی', optionLabel: '۵۰۰ گرم', qty: 1 },
    ],
    introText: 'سلام، سفارش جدید از وب‌سایت عسل باباخُرم:',
    outroText: 'لطفاً مبلغ نهایی و نحوه‌ی پرداخت را اعلام فرمایید. سپاسگزارم.',
  };

  describe('generateOrderReferenceCode', () => {
    it('generates an unambiguous alphanumeric code with hyphen (e.g. A7K3-92)', () => {
      const code = generateOrderReferenceCode();
      expect(code).toMatch(/^[23456789ABCDEFGHJKMNPQRSTVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{2}$/);
      expect(code).not.toContain('0');
      expect(code).not.toContain('O');
      expect(code).not.toContain('1');
      expect(code).not.toContain('I');
      expect(code).not.toContain('L');
    });
  });

  describe('buildFullOrderMessage (Messengers)', () => {
    it('constructs complete messenger text with Persian item counts and Latin mobile', () => {
      const message = buildFullOrderMessage(sampleData);

      expect(message).toContain('سلام، سفارش جدید از وب‌سایت عسل باباخُرم:');
      expect(message).toContain('📌 کد پیگیری: A7K3-92');
      expect(message).toContain('👤 نام و نام خانوادگی: علی رضایی');
      expect(message).toContain('📞 شماره تماس: 09123456789');
      expect(message).toContain('📍 آدرس تحویل: استان آذربایجان شرقی، تبریز، خیابان شریعتی جنوبی، کوچه بهار، پلاک ۱۲');
      expect(message).toContain('📮 کد پستی: 5133612345');
      expect(message).toContain('۱. عسل گون کوهستان - ۱ کیلوگرم × ۲ عدد');
      expect(message).toContain('۲. عسل آویشن طبیعی - ۵۰۰ گرم × ۱ عدد');
      expect(message).toContain('📝 توضیحات مشتری: لطفاً بعد از ظهر تحویل داده شود.');
      expect(message).toContain('لطفاً مبلغ نهایی و نحوه‌ی پرداخت را اعلام فرمایید. سپاسگزارم.');
    });
  });

  describe('buildCompactOrderMessage (SMS)', () => {
    it('constructs compact SMS text under 300 characters, truncating address first if needed', () => {
      const message = buildCompactOrderMessage(sampleData);

      expect(message).toContain('سفارش باباخُرم [A7K3-92]');
      expect(message).toContain('علی رضایی - 09123456789');
      expect(message).toContain('عسل گون کوهستان (۱ کیلوگرم)×۲');
      expect(message).toContain('عسل آویشن طبیعی (۵۰۰ گرم)×۱');
      expect(message).toContain('مقصد: آذربایجان شرقی، تبریز');
      expect(message.length).toBeLessThanOrEqual(300);
    });

    it('truncates very long addresses to stay within length limits', () => {
      const longAddressData = {
        ...sampleData,
        customer: {
          ...sampleData.customer,
          address: 'خیابان بسیار طویل با نام طولانی، کوچه شماره صدم، فرعی دهم، بن‌بست سوم، پلاک نهصد و نود و نه، زنگ دهم، واحد بیستم، طبقه پنجم جنوبی، روبروی پارک بزرگ شهر تبریز جنب ایستگاه اتوبوس',
        },
      };

      const message = buildCompactOrderMessage(longAddressData);
      expect(message.length).toBeLessThanOrEqual(300);
      expect(message).toContain('...');
    });
  });

  describe('buildChannelOrderLink', () => {
    it('generates valid SMS protocol link (Android & iOS formats)', () => {
      const resAndroid = buildChannelOrderLink('PHONE', '09123456789', 'متن پیام');
      expect(resAndroid.directUrl).toContain('sms:09123456789?body=');
      expect(resAndroid.isPrefillSupported).toBe(true);

      const resIos = buildChannelOrderLink('PHONE', '09123456789', 'متن پیام', { isIos: true });
      expect(resIos.directUrl).toContain('sms:09123456789&body=');
      expect(resIos.isPrefillSupported).toBe(true);
    });

    it('generates valid WhatsApp wa.me link with international phone digits', () => {
      const res = buildChannelOrderLink('WHATSAPP', '09123456789', 'متن پیام');
      expect(res.directUrl).toContain('https://wa.me/989123456789?text=');
      expect(res.isPrefillSupported).toBe(true);
    });

    it('generates direct link with pre-filled text parameter for Telegram', () => {
      const res = buildChannelOrderLink('TELEGRAM', '@babakhorram', 'متن پیام');
      expect(res.directUrl).toContain('https://t.me/babakhorram?text=');
      expect(res.isPrefillSupported).toBe(true);
    });

    it('generates direct link with pre-filled text parameter for Eitaa', () => {
      const res = buildChannelOrderLink('EITAA', '@babakhorram', 'متن پیام');
      expect(res.directUrl).toBe('https://eitaa.com/babakhorram?text=' + encodeURIComponent('متن پیام'));
      expect(res.isPrefillSupported).toBe(true);
    });

    it('generates direct link with pre-filled text parameter for Bale', () => {
      const res = buildChannelOrderLink('BALE', '@babakhorram', 'متن پیام');
      expect(res.directUrl).toBe('https://ble.ir/babakhorram?text=' + encodeURIComponent('متن پیام'));
      expect(res.isPrefillSupported).toBe(true);
    });

    it('generates direct link with pre-filled text parameter for Rubika', () => {
      const res = buildChannelOrderLink('RUBIKA', '@babakhorram', 'متن پیام');
      expect(res.directUrl).toBe('https://rubika.ir/babakhorram?text=' + encodeURIComponent('متن پیام'));
      expect(res.isPrefillSupported).toBe(true);
    });
  });

  describe('sanitizePlainText', () => {
    it('removes HTML and script tags', () => {
      const dirty = '<script>alert(1)</script>سلام <b>جهان</b>';
      expect(sanitizePlainText(dirty)).toBe('alert(1)سلام جهان');
    });

    it('strips non-printable ASCII control characters', () => {
      const withControl = 'متن\x00\x08تست\x1F';
      expect(sanitizePlainText(withControl)).toBe('متنتست');
    });

    it('enforces maximum character length', () => {
      const longText = 'الف'.repeat(100);
      expect(sanitizePlainText(longText, 20).length).toBe(20);
    });
  });
});
