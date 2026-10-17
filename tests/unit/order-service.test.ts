import { describe, it, expect } from 'vitest';
import {
  OrderService,
  buildChannelOrderLink,
  buildChannelOrderUrl,
  generateOrderReferenceCode,
  buildFullOrderMessage,
  buildCompactOrderMessage,
  sanitizePlainText,
} from '@/server/services/order-service';

describe('OrderService & Order Deep-Link Generators (Addendum A5/A6)', () => {
  const sampleOrderText = 'سلام، سفارش عسل باباخُرم کد A7K3-92\nاقلام: عسل گون';

  describe('buildChannelOrderUrl', () => {
    it('generates pre-filled WhatsApp deep link with international prefix 98', () => {
      const url = buildChannelOrderUrl('WHATSAPP', '09389196010', sampleOrderText);
      expect(url).toBe(`https://wa.me/989389196010?text=${encodeURIComponent(sampleOrderText)}`);
    });

    it('generates pre-filled Telegram deep link with clean username', () => {
      const url = buildChannelOrderUrl('TELEGRAM', '@babakhorram_honey', sampleOrderText);
      expect(url).toBe(`https://t.me/babakhorram_honey?text=${encodeURIComponent(sampleOrderText)}`);
    });

    it('generates pre-filled Eitaa deep link with ?text= parameter', () => {
      const url = buildChannelOrderUrl('EITAA', '@babakhorram_honey', sampleOrderText);
      expect(url).toBe(`https://eitaa.com/babakhorram_honey?text=${encodeURIComponent(sampleOrderText)}`);
    });

    it('generates pre-filled Bale deep link with ?text= parameter', () => {
      const url = buildChannelOrderUrl('BALE', '@babakhorram_honey', sampleOrderText);
      expect(url).toBe(`https://ble.ir/babakhorram_honey?text=${encodeURIComponent(sampleOrderText)}`);
    });

    it('generates pre-filled Rubika deep link with ?text= parameter', () => {
      const url = buildChannelOrderUrl('RUBIKA', '@babakhorram_honey', sampleOrderText);
      expect(url).toBe(`https://rubika.ir/babakhorram_honey?text=${encodeURIComponent(sampleOrderText)}`);
    });

    it('generates platform-aware SMS links for Android (?body=) and iOS (&body=)', () => {
      const androidUrl = buildChannelOrderUrl('PHONE', '09389196010', sampleOrderText, { isIos: false });
      expect(androidUrl).toBe(`sms:09389196010?body=${encodeURIComponent(sampleOrderText)}`);

      const iosUrl = buildChannelOrderUrl('PHONE', '09389196010', sampleOrderText, { isIos: true });
      expect(iosUrl).toBe(`sms:09389196010&body=${encodeURIComponent(sampleOrderText)}`);
    });
  });

  describe('OrderService static methods', () => {
    it('generates unambiguous reference codes', () => {
      const code = OrderService.generateReferenceCode();
      expect(code).toMatch(/^[23456789ABCDEFGHJKMNPQRSTVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{2}$/);
    });

    it('sanitizes input text properly', () => {
      const clean = OrderService.sanitizeText('<b>تست</b>\x00');
      expect(clean).toBe('تست');
    });

    it('builds full and compact messages through OrderService', () => {
      const opts = {
        referenceCode: 'K892-23',
        customer: {
          firstName: 'سارا',
          lastName: 'محمدی',
          mobile: '09121112233',
          province: 'البرز',
          city: 'کرج',
          address: 'جهانشهر، بلوار مولانا',
        },
        items: [{ productNameFa: 'عسل گون', optionLabel: '۱ کیلو', qty: 1 }],
      };

      const full = OrderService.buildFullMessage(opts);
      expect(full).toContain('K892-23');
      expect(full).toContain('سارا محمدی');

      const compact = OrderService.buildCompactMessage(opts);
      expect(compact).toContain('K892-23');
      expect(compact.length).toBeLessThanOrEqual(300);
    });

    it('builds full order message with preferredContactMethod and single address line', () => {
      const opts = {
        referenceCode: 'B4K8-91',
        customer: {
          firstName: 'حمید',
          lastName: 'نیکزاد',
          mobile: '09129876543',
          address: 'تهران، زعفرانیه، پلاک ۱۲',
          preferredContactMethod: 'ایتا',
        },
        items: [{ productNameFa: 'عسل آویشن کوهی', optionLabel: '۵۰۰ گرم', qty: 2 }],
      };

      const full = OrderService.buildFullMessage(opts);
      expect(full).toContain('B4K8-91');
      expect(full).toContain('حمید نیکزاد');
      expect(full).toContain('💬 روش ترجیحی هماهنگی: ایتا');
      expect(full).toContain('📍 آدرس / توضیحات تحویل: تهران، زعفرانیه، پلاک ۱۲');
      expect(full).toContain('عسل آویشن کوهی - ۵۰۰ گرم × ۲ عدد');
    });
  });
});
