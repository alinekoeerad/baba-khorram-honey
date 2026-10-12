/**
 * Order Message Builders & Channel Link Generators (Phase 9 Task 6 & Addendum A5/A6)
 *
 * Rules:
 * - Pure formatting functions for Full and Compact message templates.
 * - Reference code generation with unambiguous characters.
 * - Control character stripping & plain text sanitization.
 * - Persian digits for generated item numbers & counts; Latin digits for mobile & reference code.
 * - Verified channel URL generators with copy-then-open fallbacks.
 */

import { toPersianDigits } from '@/lib/domain-utils';
import type { ChannelType } from '@prisma/client';

export interface OrderItemLine {
  productNameFa: string;
  optionLabel: string;
  qty: number;
}

export interface OrderCustomerDetails {
  firstName: string;
  lastName: string;
  mobile: string;
  province: string;
  city: string;
  address: string;
  postalCode?: string;
  notes?: string;
}

export interface BuildMessageOptions {
  referenceCode: string;
  customer: OrderCustomerDetails;
  items: OrderItemLine[];
  introText?: string | null;
  outroText?: string | null;
}

/**
 * Strips dangerous control characters, HTML tags, and trims whitespace.
 */
export function sanitizePlainText(text: string | null | undefined, maxLen = 500): string {
  if (!text) return '';
  // Remove HTML tags
  let clean = text.replace(/<[^>]*>?/gm, '');
  // Remove ASCII control characters except newline and tab
  clean = clean.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  // Normalize consecutive spaces/newlines
  clean = clean.trim();
  if (clean.length > maxLen) {
    clean = clean.substring(0, maxLen).trim();
  }
  return clean;
}

/**
 * Generates an unambiguous reference code (e.g. A7K3-92)
 * using Crockford base-32 characters (excluding 0, O, 1, I, L).
 */
export function generateOrderReferenceCode(): string {
  const chars = '23456789ABCDEFGHJKMNPQRSTVWXYZ';
  const pick = (len: number) => {
    let res = '';
    for (let i = 0; i < len; i++) {
      const idx = Math.floor(Math.random() * chars.length);
      res += chars[idx];
    }
    return res;
  };
  return `${pick(4)}-${pick(2)}`;
}

/**
 * Full Message Format (Messengers: WhatsApp, Telegram, Eitaa, Bale, Rubika)
 * Brief Addendum A5.
 */
export function buildFullOrderMessage(opts: BuildMessageOptions): string {
  const intro =
    opts.introText?.trim() || 'سلام، سفارش جدید از وب‌سایت عسل باباخُرم:';
  const outro =
    opts.outroText?.trim() ||
    'لطفاً مبلغ نهایی و نحوه‌ی پرداخت را اعلام فرمایید. سپاسگزارم.';

  const lines: string[] = [
    intro,
    '',
    `📌 کد پیگیری: ${opts.referenceCode}`,
    `👤 نام و نام خانوادگی: ${opts.customer.firstName} ${opts.customer.lastName}`,
    `📞 شماره تماس: ${opts.customer.mobile}`,
    `📍 آدرس تحویل: استان ${opts.customer.province}، ${opts.customer.city}، ${opts.customer.address}`,
  ];

  if (opts.customer.postalCode?.trim()) {
    lines.push(`📮 کد پستی: ${opts.customer.postalCode.trim()}`);
  }

  lines.push('');
  lines.push('🛒 اقلام سفارش:');
  opts.items.forEach((item, idx) => {
    const numFa = toPersianDigits(idx + 1);
    const qtyFa = toPersianDigits(item.qty);
    lines.push(`${numFa}. ${item.productNameFa} - ${item.optionLabel} × ${qtyFa} عدد`);
  });

  if (opts.customer.notes?.trim()) {
    lines.push('');
    lines.push(`📝 توضیحات مشتری: ${opts.customer.notes.trim()}`);
  }

  lines.push('');
  lines.push(outro);

  return lines.join('\n');
}

/**
 * Compact Message Format (SMS)
 * Brief Addendum A5: Target <= 300 characters, truncating address first if needed.
 */
export function buildCompactOrderMessage(opts: BuildMessageOptions): string {
  const itemsText = opts.items
    .map((item) => `${item.productNameFa} (${item.optionLabel})×${toPersianDigits(item.qty)}`)
    .join('، ');

  const fullName = `${opts.customer.firstName} ${opts.customer.lastName}`;
  const basePrefix = `سفارش باباخُرم [${opts.referenceCode}]\n${fullName} - ${opts.customer.mobile}\nاقلام: ${itemsText}\nمقصد: ${opts.customer.province}، ${opts.customer.city} - `;

  // Target max 300 chars for SMS efficiency
  const maxAddressLen = Math.max(20, 300 - basePrefix.length);
  let addr = opts.customer.address;
  if (addr.length > maxAddressLen) {
    addr = addr.substring(0, maxAddressLen - 3) + '...';
  }

  return `${basePrefix}${addr}`;
}

export interface ChannelLinkResult {
  directUrl: string;
  isPrefillSupported: boolean;
  instructionsFa: string;
}

/**
 * Generates verified deep links for mobile and web clients.
 * Official Link Patterns (Addendum A6):
 * - SMS: sms:<cleanNumber>?body=<encoded>
 * - WhatsApp: https://wa.me/<cleanNumber>?text=<encoded>
 * - Telegram: https://t.me/<username> (Prefill unverified for direct chat -> copy-then-open)
 * - Eitaa: https://eitaa.com/<username> (Prefill unverified -> copy-then-open)
 * - Bale: https://ble.ir/<username> (Prefill unverified -> copy-then-open)
 * - Rubika: https://rubika.ir/<username> (Prefill unverified -> copy-then-open)
 */
export function buildChannelOrderLink(
  type: ChannelType,
  value: string,
  messageText: string
): ChannelLinkResult {
  const encodedText = encodeURIComponent(messageText);

  switch (type) {
    case 'PHONE': {
      // Clean phone number for tel/sms protocols
      const cleanPhone = value.replace(/[^0-9+]/g, '');
      return {
        directUrl: `sms:${cleanPhone}?body=${encodedText}`,
        isPrefillSupported: true,
        instructionsFa: 'برنامه پیامک گوشی باز می‌شود و متن سفارش به صورت خودکار درج می‌گردد.',
      };
    }

    case 'WHATSAPP': {
      // Digits only in international format (e.g. 989123456789)
      let cleanPhone = value.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '98' + cleanPhone.substring(1);
      }
      return {
        directUrl: `https://wa.me/${cleanPhone}?text=${encodedText}`,
        isPrefillSupported: true,
        instructionsFa: 'واتساپ باز شده و متن سفارش در پیام آماده ارسال خواهد بود.',
      };
    }

    case 'TELEGRAM': {
      const cleanUsername = value.replace(/^@/, '').trim();
      return {
        directUrl: `https://t.me/${cleanUsername}`,
        isPrefillSupported: false,
        instructionsFa: 'متن سفارش کپی شد؛ در گفتگوی تلگرام Paste کرده و ارسال فرمایید.',
      };
    }

    case 'EITAA': {
      const cleanUsername = value.replace(/^@/, '').trim();
      return {
        directUrl: `https://eitaa.com/${cleanUsername}`,
        isPrefillSupported: false,
        instructionsFa: 'متن سفارش کپی شد؛ در پیام‌رسان ایتا Paste کرده و ارسال فرمایید.',
      };
    }

    case 'BALE': {
      const cleanUsername = value.replace(/^@/, '').trim();
      return {
        directUrl: `https://ble.ir/${cleanUsername}`,
        isPrefillSupported: false,
        instructionsFa: 'متن سفارش کپی شد؛ در پیام‌رسان بله Paste کرده و ارسال فرمایید.',
      };
    }

    case 'RUBIKA': {
      const cleanUsername = value.replace(/^@/, '').trim();
      return {
        directUrl: `https://rubika.ir/${cleanUsername}`,
        isPrefillSupported: false,
        instructionsFa: 'متن سفارش کپی شد؛ در روبیکا Paste کرده و ارسال فرمایید.',
      };
    }

    default: {
      return {
        directUrl: '#',
        isPrefillSupported: false,
        instructionsFa: 'متن سفارش کپی شد؛ در پیام‌رسان مورد نظر Paste فرمایید.',
      };
    }
  }
}
