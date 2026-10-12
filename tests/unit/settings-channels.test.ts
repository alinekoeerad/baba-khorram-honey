import { describe, it, expect } from 'vitest';
import {
  buildChannelUrl,
  validateChannel,
  normalizeChannelValue,
} from '@/lib/contact-channels';
import { SettingsService } from '@/server/services/settings-service';

describe('Contact Channels URL Builders (Phase 5, Task 1 & 6)', () => {
  it('correctly builds phone tel: URLs', () => {
    expect(buildChannelUrl('PHONE', '09121234567')).toBe('tel:09121234567');
    expect(buildChannelUrl('PHONE', '+989121234567')).toBe('tel:+989121234567');
  });

  it('correctly builds WhatsApp click-to-chat URLs in international format', () => {
    expect(buildChannelUrl('WHATSAPP', '989121234567')).toBe('https://wa.me/989121234567');
    expect(buildChannelUrl('WHATSAPP', '+989121234567')).toBe('https://wa.me/989121234567');
  });

  it('correctly builds Telegram deep links without @', () => {
    expect(buildChannelUrl('TELEGRAM', 'babakhorram_honey')).toBe('https://t.me/babakhorram_honey');
    expect(buildChannelUrl('TELEGRAM', '@babakhorram_honey')).toBe('https://t.me/babakhorram_honey');
  });

  it('correctly builds Iranian domestic messenger URLs (Eitaa, Rubika, Bale)', () => {
    expect(buildChannelUrl('EITAA', 'babakhorram_honey')).toBe('https://eitaa.com/babakhorram_honey');
    expect(buildChannelUrl('RUBIKA', 'babakhorram_honey')).toBe('https://rubika.ir/babakhorram_honey');
    expect(buildChannelUrl('BALE', 'babakhorram_honey')).toBe('https://ble.ir/babakhorram_honey');
  });

  it('correctly builds Instagram profile URLs without @', () => {
    expect(buildChannelUrl('INSTAGRAM', 'babakhorram_honey')).toBe('https://instagram.com/babakhorram_honey');
  });
});

describe('Contact Channel Validation Rules (Brief Section 6 & Addendum A2)', () => {
  it('strictly forbids acceptsOrders on INSTAGRAM', () => {
    const res = validateChannel('INSTAGRAM', 'babakhorram_honey', true);
    expect(res.isValid).toBe(false);
    expect(res.errorFa).toContain('اینستاگرام');
  });

  it('permits acceptsOrders on valid messengers (WhatsApp, Telegram, Eitaa, Bale, Rubika)', () => {
    expect(validateChannel('WHATSAPP', '989121234567', true).isValid).toBe(true);
    expect(validateChannel('TELEGRAM', 'babakhorram_honey', true).isValid).toBe(true);
    expect(validateChannel('EITAA', 'babakhorram_honey', true).isValid).toBe(true);
    expect(validateChannel('RUBIKA', 'babakhorram_honey', true).isValid).toBe(true);
    expect(validateChannel('BALE', 'babakhorram_honey', true).isValid).toBe(true);
  });

  it('enforces Iranian mobile number when acceptsOrders is true for PHONE', () => {
    // Landline phone is valid for contact, but invalid for receiving orders/SMS
    expect(validateChannel('PHONE', '02188776655', false).isValid).toBe(true);
    const orderLandline = validateChannel('PHONE', '02188776655', true);
    expect(orderLandline.isValid).toBe(false);
    expect(orderLandline.errorFa).toContain('شماره موبایل معتبر');

    // Valid mobile number
    expect(validateChannel('PHONE', '09121234567', true).isValid).toBe(true);
  });

  it('normalizes Persian and Arabic digits and strips leading @', () => {
    expect(normalizeChannelValue('TELEGRAM', '@my_channel')).toBe('my_channel');
    expect(normalizeChannelValue('PHONE', '۰۹۱۲۳۴۵۶۷۸۹')).toBe('09123456789');
  });
});

describe('SiteSettings Validation & Length Limits (Addendum A2)', () => {
  it('enforces 200 character limit on orderIntroText and orderOutroText', async () => {
    const longText = 'الف'.repeat(201);
    await expect(SettingsService.updateSettings({ orderIntroText: longText })).rejects.toThrow(
      'متن مقدمه سفارش نباید بیشتر از ۲۰۰ نویسه باشد'
    );
    await expect(SettingsService.updateSettings({ orderOutroText: longText })).rejects.toThrow(
      'متن پایانی سفارش نباید بیشتر از ۲۰۰ نویسه باشد'
    );
  });
});
