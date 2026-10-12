/**
 * Contact Channels Configuration, Validation & URL Pattern Engine (Phase 5, Task 1)
 *
 * Implements server-side verified URL construction and validation rules per Brief Section 6
 * and Addendum A2 (Cart & Order Channel Rules).
 */

import { validateAndNormalizeIranianMobile } from './domain-utils';

export type ChannelType =
  | 'PHONE'
  | 'WHATSAPP'
  | 'TELEGRAM'
  | 'EITAA'
  | 'RUBIKA'
  | 'BALE'
  | 'INSTAGRAM';

export interface ChannelTypeMeta {
  type: ChannelType;
  titleFa: string;
  defaultLabel: string;
  iconName: string;
  allowedOrderChannel: boolean;
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
    orderChannelHintFa: 'اینستاگرام امکان دریافت خودکار پیش‌فاکتور یا سفارش را ندارد.',
    placeholderFa: 'نام کاربری بدون @',
    example: 'babakhorram_honey',
  },
};

/**
 * Normalizes input value for channel storage
 */
export function normalizeChannelValue(type: ChannelType, rawValue: string): string {
  let val = rawValue.trim();
  // Strip leading @ for social handles
  if (val.startsWith('@')) {
    val = val.substring(1);
  }
  // Convert Persian/Arabic digits to Latin digits
  val = val
    .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1728))
    .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1584));

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

  // Addendum A2 rule: INSTAGRAM can never accept orders
  if (type === 'INSTAGRAM' && acceptsOrders) {
    return {
      isValid: false,
      normalizedValue: value,
      errorFa: 'اینستاگرام نمی‌تواند به عنوان کانال دریافت سفارش فعال شود.',
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

    default:
      return { isValid: true, normalizedValue: value };
  }
}

/**
 * Builds the canonical public URL for a given contact channel
 * Constructed strictly server-side using the verified pattern table.
 */
export function buildChannelUrl(type: ChannelType, rawValue: string): string {
  const value = normalizeChannelValue(type, rawValue);

  switch (type) {
    case 'PHONE':
      return `tel:${value}`;
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
    default:
      return '#';
  }
}
