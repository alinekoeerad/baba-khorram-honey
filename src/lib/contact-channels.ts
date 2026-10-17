/**
 * Contact Channels Configuration, Validation & URL Pattern Engine (Phase 5, Task 1)
 *
 * Implements server-side verified URL construction and validation rules per Brief Section 6
 * and Addendum A2 (Cart & Order Channel Rules).
 */

import { validateAndNormalizeIranianMobile, normalizeDigits } from './domain-utils';

export type ChannelType =
  | 'PHONE'
  | 'WHATSAPP'
  | 'TELEGRAM'
  | 'EITAA'
  | 'RUBIKA'
  | 'BALE'
  | 'INSTAGRAM'
  | 'YOUTUBE';

export interface ChannelTypeMeta {
  type: ChannelType;
  titleFa: string;
  defaultLabel: string;
  iconName: string;
  allowedOrderChannel: boolean;
  canAcceptOrders?: boolean;
  orderChannelHintFa?: string;
  placeholderFa: string;
  example: string;
}

export const CHANNEL_TYPES_META: Record<ChannelType, ChannelTypeMeta> = {
  PHONE: {
    type: 'PHONE',
    titleFa: 'تماس تلفنی / پیامک',
    defaultLabel: 'تماس تلفنی',
    iconName: 'phone',
    allowedOrderChannel: true,
    orderChannelHintFa: 'در صورت فعال‌سازی دریافت سفارش، باید شماره موبایل معتبر ایران (۰۹...) باشد.',
    placeholderFa: '۰۹۱۲۳۴۵۶۷۸۹ یا ۰۲۱۱۲۳۴۵۶۷۸',
    example: '09121234567',
  },
  WHATSAPP: {
    type: 'WHATSAPP',
    titleFa: 'واتساپ (WhatsApp)',
    defaultLabel: 'واتساپ',
    iconName: 'whatsapp',
    allowedOrderChannel: true,
    placeholderFa: 'شماره با پیش‌شماره کشور، مانند 989123456789',
    example: '989121234567',
  },
  TELEGRAM: {
    type: 'TELEGRAM',
    titleFa: 'تلگرام (Telegram)',
    defaultLabel: 'تلگرام',
    iconName: 'telegram',
    allowedOrderChannel: true,
    placeholderFa: 'نام کاربری بدون @',
    example: 'babakhorram_honey',
  },
  EITAA: {
    type: 'EITAA',
    titleFa: 'ایتا (Eitaa)',
    defaultLabel: 'ایتا',
    iconName: 'eitaa',
    allowedOrderChannel: true,
    placeholderFa: 'شناسه کانال یا کاربری بدون @',
    example: 'babakhorram_honey',
  },
  RUBIKA: {
    type: 'RUBIKA',
    titleFa: 'روبیکا (Rubika)',
    defaultLabel: 'روبیکا',
    iconName: 'rubika',
    allowedOrderChannel: true,
    placeholderFa: 'شناسه بدون @',
    example: 'babakhorram_honey',
  },
  BALE: {
    type: 'BALE',
    titleFa: 'بله (Bale)',
    defaultLabel: 'بله',
    iconName: 'bale',
    allowedOrderChannel: true,
    placeholderFa: 'شناسه بدون @',
    example: 'babakhorram_honey',
  },
  INSTAGRAM: {
    type: 'INSTAGRAM',
    titleFa: 'اینستاگرام (Instagram)',
    defaultLabel: 'اینستاگرام',
    iconName: 'instagram',
    allowedOrderChannel: false,
    canAcceptOrders: false,
    orderChannelHintFa: 'اینستاگرام امکان دریافت خودکار پیش‌فاکتور یا سفارش را ندارد.',
    placeholderFa: 'نام کاربری بدون @',
    example: 'babakhorram_honey',
  },
  YOUTUBE: {
    type: 'YOUTUBE',
    titleFa: 'یوتیوب',
    defaultLabel: 'کانال یوتیوب',
    iconName: 'youtube',
    allowedOrderChannel: false,
    canAcceptOrders: false,
    orderChannelHintFa: 'یوتیوب امکان دریافت سفارش را ندارد.',
    placeholderFa: 'نام کاربری کانال (مثال: baba.khoram)',
    example: 'baba.khoram',
  },
};

/**
 * Normalizes input value for channel storage
 */
export function normalizeChannelValue(type: ChannelType, rawValue: string): string {
  let val = normalizeDigits(rawValue).trim();
  if (type === 'YOUTUBE') {
    val = val.replace(/^(https?:\/\/)?(www\.)?youtube\.com\/(@)?/i, '');
  }
  // Strip leading @ for social handles
  if (val.startsWith('@')) {
    val = val.substring(1);
  }
  return val;
}

/**
 * Validates a channel value according to its type and acceptsOrders constraint
 */
export function validateChannel(
  type: ChannelType,
  rawValue: string,
  acceptsOrders: boolean
): { isValid: boolean; normalizedValue: string; errorFa?: string } {
  const value = normalizeChannelValue(type, rawValue);

  if (!value) {
    return { isValid: false, normalizedValue: '', errorFa: 'مقدار کانال ارتباطی الزامی است.' };
  }

  // Addendum A2 rule: INSTAGRAM and YOUTUBE can never accept orders
  if ((type === 'INSTAGRAM' || type === 'YOUTUBE') && acceptsOrders) {
    return {
      isValid: false,
      normalizedValue: value,
      errorFa: `${CHANNEL_TYPES_META[type].titleFa} نمی‌تواند به عنوان کانال دریافت سفارش فعال شود.`,
    };
  }

  switch (type) {
    case 'PHONE': {
      // Allow digits and optional leading +
      const clean = value.replace(/[\s-]/g, '');
      const phoneRegex = /^\+?[0-9]{8,15}$/;
      if (!phoneRegex.test(clean)) {
        return {
          isValid: false,
          normalizedValue: clean,
          errorFa: 'شماره تلفن نامعتبر است. فقط ارقام و علامت + در ابتدا مجاز است.',
        };
      }

      // If acceptsOrders is true, it MUST be a valid Iranian mobile number (09... or +989...)
      if (acceptsOrders) {
        const mobileCheck = validateAndNormalizeIranianMobile(clean);
        if (!mobileCheck.isValid) {
          return {
            isValid: false,
            normalizedValue: clean,
            errorFa: 'کانال پیامکی دریافت سفارش باید شماره موبایل معتبر ایران (۰۹...) باشد.',
          };
        }
      }

      return { isValid: true, normalizedValue: clean };
    }

    case 'WHATSAPP': {
      const clean = value.replace(/[\s-+]/g, '');
      if (!/^[0-9]{10,15}$/.test(clean)) {
        return {
          isValid: false,
          normalizedValue: clean,
          errorFa: 'شماره واتساپ باید ارقام کامل بین‌المللی بدون + یا خط تیره باشد (مانند 989123456789).',
        };
      }
      return { isValid: true, normalizedValue: clean };
    }

    case 'TELEGRAM': {
      if (!/^[A-Za-z0-9_]{5,32}$/.test(value)) {
        return {
          isValid: false,
          normalizedValue: value,
          errorFa: 'شناسه تلگرام باید ۵ تا ۳۲ نویسه شامل حروف انگلیسی، ارقام و زیرخط باشد.',
        };
      }
      return { isValid: true, normalizedValue: value };
    }

    case 'EITAA':
    case 'RUBIKA':
    case 'BALE': {
      if (!/^[A-Za-z0-9_]{3,32}$/.test(value)) {
        return {
          isValid: false,
          normalizedValue: value,
          errorFa: `شناسه ${CHANNEL_TYPES_META[type].titleFa} باید ۳ تا ۳۲ نویسه شامل حروف انگلیسی، ارقام و زیرخط باشد.`,
        };
      }
      return { isValid: true, normalizedValue: value };
    }

    case 'INSTAGRAM': {
      if (!/^[A-Za-z0-9_.]{1,30}$/.test(value)) {
        return {
          isValid: false,
          normalizedValue: value,
          errorFa: 'نام کاربری اینستاگرام باید حداکثر ۳۰ نویسه شامل حروف انگلیسی، ارقام، نقطه و زیرخط باشد.',
        };
      }
      return { isValid: true, normalizedValue: value };
    }

    case 'YOUTUBE': {
      if (!/^[A-Za-z0-9_.-]{3,50}$/.test(value)) {
        return {
          isValid: false,
          normalizedValue: value,
          errorFa: 'شناسه کانال یوتیوب باید ۳ تا ۵۰ نویسه شامل حروف انگلیسی، ارقام، نقطه، خط تیره و زیرخط باشد.',
        };
      }
      return { isValid: true, normalizedValue: value };
    }

    default:
      return { isValid: true, normalizedValue: value };
  }
}

/**
 * Builds the pre-filled order deep-link URL for messengers and SMS with URL-encoded orderText.
 */
export function buildChannelOrderUrl(
  type: ChannelType,
  rawValue: string,
  orderText: string,
  options?: { isIos?: boolean }
): string {
  const encodedText = encodeURIComponent(orderText);
  const value = normalizeChannelValue(type, rawValue);

  switch (type) {
    case 'PHONE': {
      const cleanPhone = value.replace(/[^0-9+]/g, '');
      const separator = options?.isIos ? '&' : '?';
      return `sms:${cleanPhone}${separator}body=${encodedText}`;
    }
    case 'WHATSAPP': {
      let cleanPhone = value.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('00')) {
        cleanPhone = cleanPhone.substring(2);
      } else if (cleanPhone.startsWith('0')) {
        cleanPhone = '98' + cleanPhone.substring(1);
      } else if (!cleanPhone.startsWith('98') && cleanPhone.length === 10) {
        cleanPhone = '98' + cleanPhone;
      }
      return `https://wa.me/${cleanPhone}?text=${encodedText}`;
    }
    case 'TELEGRAM': {
      const cleanUsername = value.replace(/^@/, '').trim();
      return `https://t.me/${cleanUsername}?text=${encodedText}`;
    }
    case 'EITAA': {
      const cleanUsername = value.replace(/^@/, '').trim();
      return `https://eitaa.com/${cleanUsername}?text=${encodedText}`;
    }
    case 'BALE': {
      const cleanUsername = value.replace(/^@/, '').trim();
      return `https://ble.ir/${cleanUsername}?text=${encodedText}`;
    }
    case 'RUBIKA': {
      const cleanUsername = value.replace(/^@/, '').trim();
      return `https://rubika.ir/${cleanUsername}?text=${encodedText}`;
    }
    case 'INSTAGRAM':
      return `https://instagram.com/${value}`;
    case 'YOUTUBE': {
      let clean = value;
      clean = clean.replace(/^(https?:\/\/)?(www\.)?youtube\.com\/(@)?/i, '');
      if (clean.startsWith('@')) clean = clean.substring(1);
      return `https://youtube.com/@${clean}`;
    }
    default:
      return '#';
  }
}

/**
 * Builds the canonical public URL for a given contact channel
 * Constructed strictly server-side using the verified pattern table.
 * If orderText is provided, returns the prefilled order deep-link.
 */
export function buildChannelUrl(
  type: ChannelType,
  rawValue: string,
  orderText?: string,
  options?: { isIos?: boolean }
): string {
  if (orderText) {
    return buildChannelOrderUrl(type, rawValue, orderText, options);
  }

  const value = normalizeChannelValue(type, rawValue);

  switch (type) {
    case 'PHONE': {
      const clean = value.replace(/[^0-9+]/g, '');
      return `tel:${clean}`;
    }
    case 'WHATSAPP': {
      const clean = value.replace(/[^0-9]/g, '');
      return `https://wa.me/${clean}`;
    }
    case 'TELEGRAM':
      return `https://t.me/${value}`;
    case 'EITAA':
      return `https://eitaa.com/${value}`;
    case 'RUBIKA':
      return `https://rubika.ir/${value}`;
    case 'BALE':
      return `https://ble.ir/${value}`;
    case 'INSTAGRAM':
      return `https://instagram.com/${value}`;
    case 'YOUTUBE': {
      let clean = value;
      clean = clean.replace(/^(https?:\/\/)?(www\.)?youtube\.com\/(@)?/i, '');
      if (clean.startsWith('@')) clean = clean.substring(1);
      return `https://youtube.com/@${clean}`;
    }
    default:
      return '#';
  }
}

// Re-export order link generator and clipboard helpers for centralized access
export { buildChannelOrderLink } from './order-builder';
export { copyTextToClipboard, isIosDevice, buildSmsUri } from './clipboard';
