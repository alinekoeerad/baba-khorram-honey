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

  it('correctly builds YouTube channel URLs', () => {
    expect(buildChannelUrl('YOUTUBE', 'baba.khoram')).toBe('https://youtube.com/@baba.khoram');
    expect(buildChannelUrl('YOUTUBE', '@baba.khoram')).toBe('https://youtube.com/@baba.khoram');
    expect(buildChannelUrl('YOUTUBE', 'https://youtube.com/@baba.khoram')).toBe('https://youtube.com/@baba.khoram');
    expect(buildChannelUrl('YOUTUBE', 'youtube.com/@baba.khoram')).toBe('https://youtube.com/@baba.khoram');
  });
});

describe('Contact Channel Validation Rules (Brief Section 6 & Addendum A2)', () => {
  it('strictly forbids acceptsOrders on INSTAGRAM and YOUTUBE', () => {
    const resInsta = validateChannel('INSTAGRAM', 'babakhorram_honey', true);
    expect(resInsta.isValid).toBe(false);
    expect(resInsta.errorFa).toContain('اینستاگرام');

    const resYt = validateChannel('YOUTUBE', 'baba.khoram', true);
    expect(resYt.isValid).toBe(false);
    expect(resYt.errorFa).toContain('یوتیوب');
  });

  it('validates YouTube channel handles correctly', () => {
    expect(validateChannel('YOUTUBE', 'baba.khoram', false).isValid).toBe(true);
    expect(validateChannel('YOUTUBE', '@baba.khoram', false).isValid).toBe(true);
    expect(validateChannel('YOUTUBE', 'ab', false).isValid).toBe(false); // too short
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

  it('returns official store location in Karaj (Jahanshahr, Blvd Molana) by default', async () => {
    const settings = await SettingsService.getSettings();
    expect(settings.address).toContain('کرج، جهانشهر، بلوار مولانا');
    expect(settings.latitude).toBeCloseTo(35.8339878, 4);
    expect(settings.longitude).toBeCloseTo(50.9915841, 4);
    expect(settings.mapZoom).toBe(15);
  });

  it('supports persisting and retrieving Bale and Eitaa bot tokens and chat IDs', async () => {
    const updated = await SettingsService.updateSettings({
      baleBotToken: '123456789:ABCdefGHI',
      baleChatId: '987654321',
      eitaaBotToken: 'bot_eitaa_token_xyz',
      eitaaChatId: 'eitaa_chat_admin',
    });

    expect(updated.baleBotToken).toBe('123456789:ABCdefGHI');
    expect(updated.baleChatId).toBe('987654321');
    expect(updated.eitaaBotToken).toBe('bot_eitaa_token_xyz');
    expect(updated.eitaaChatId).toBe('eitaa_chat_admin');

    const fresh = await SettingsService.getSettings();
    expect(fresh.baleBotToken).toBe('123456789:ABCdefGHI');
    expect(fresh.baleChatId).toBe('987654321');
    expect(fresh.eitaaBotToken).toBe('bot_eitaa_token_xyz');
    expect(fresh.eitaaChatId).toBe('eitaa_chat_admin');
  });

  it('strictly excludes bot tokens and chat IDs from getPublicSiteSettings allowlist (F1)', async () => {
    // 1. Ensure backend service has secret bot tokens configured
    await SettingsService.updateSettings({
      baleBotToken: 'secret_bale_token_test_123',
      baleChatId: 'bale_admin_chat_id',
      eitaaBotToken: 'secret_eitaa_token_test_456',
      eitaaChatId: 'eitaa_admin_chat_id',
    });

    const { getPublicSiteSettings } = await import('@/server/queries/settings');
    const publicSettings = await getPublicSiteSettings();

    // 2. Assert that secret keys do NOT exist on the public object
    expect(publicSettings).not.toHaveProperty('baleBotToken');
    expect(publicSettings).not.toHaveProperty('baleChatId');
    expect(publicSettings).not.toHaveProperty('eitaaBotToken');
    expect(publicSettings).not.toHaveProperty('eitaaChatId');

    expect((publicSettings as any).baleBotToken).toBeUndefined();
    expect((publicSettings as any).baleChatId).toBeUndefined();
    expect((publicSettings as any).eitaaBotToken).toBeUndefined();
    expect((publicSettings as any).eitaaChatId).toBeUndefined();

    // 3. Strict allowlist assertion: only public fields are present
    const allowedKeys = new Set([
      'id',
      'siteNameFa',
      'siteNameEn',
      'tagline',
      'logoId',
      'logo',
      'footerLogoId',
      'footerLogo',
      'ogImageId',
      'ogImage',
      'address',
      'workingHours',
      'latitude',
      'longitude',
      'mapZoom',
      'copyrightText',
      'seoTitle',
      'seoDescription',
      'cartEnabled',
      'cartNotice',
      'orderIntroText',
      'orderOutroText',
      'isPlaceholder',
    ]);

    for (const key of Object.keys(publicSettings)) {
      expect(allowedKeys.has(key)).toBe(true);
    }
  });
});

