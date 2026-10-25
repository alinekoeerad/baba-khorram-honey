/**
 * Site Settings & Contact Channels Domain Service (Phase 5, Tasks 1 & 5)
 * Manages branding, contact details, coordinates, SEO, cart settings, and contact channels.
 * Handles cache revalidation and mutation audit logging.
 */

import 'server-only';

import { db } from '../db/client';
import { recordAuditLog } from './audit-log-service';
import { revalidateTag, revalidatePath } from 'next/cache';
import { validateChannel, ChannelType } from '@/lib/contact-channels';
import { parseLocalizedNumber, parseLocalizedInt } from '@/lib/domain-utils';

export interface SiteSettingsData {
  id?: number;
  siteNameFa: string;
  siteNameEn?: string | null;
  tagline?: string | null;
  logoId?: string | null;
  logo?: any;
  footerLogoId?: string | null;
  footerLogo?: any;
  ogImageId?: string | null;
  ogImage?: any;
  address?: string | null;
  workingHours?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  mapZoom?: number | null;
  copyrightText?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  cartEnabled: boolean;
  cartNotice: string;
  orderIntroText?: string | null;
  orderOutroText?: string | null;
  baleBotToken?: string | null;
  baleChatId?: string | null;
  eitaaBotToken?: string | null;
  eitaaChatId?: string | null;
  isPlaceholder?: boolean;
}

export interface ContactChannelData {
  id?: string;
  type: ChannelType;
  value: string;
  label?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  showInContactBar?: boolean;
  showInFooter?: boolean;
  showInContactPage?: boolean;
  acceptsOrders?: boolean;
}

const DEFAULT_SETTINGS: SiteSettingsData = {
  id: 1,
  siteNameFa: 'عسل باباخُرم',
  siteNameEn: 'Baba Khorram Honey',
  tagline: 'طعم اصیل و طبیعی کوهستان',
  logoId: null,
  footerLogoId: null,
  ogImageId: null,
  address: 'کرج، جهانشهر، بلوار مولانا',
  workingHours: 'همه‌روزه از ساعت ۹:۰۰ الی ۲۱:۰۰',
  latitude: 35.8339878,
  longitude: 50.9915841,
  mapZoom: 15,
  copyrightText: 'تمامی حقوق برای برند عسل باباخُرم محفوظ است. طراحی و توسعه ۱۴۰۵.',
  seoTitle: 'عسل باباخُرم | طعم اصیل و طبیعی کوهستان',
  seoDescription: 'تولید و عرضه مستقیم انواع عسل طبیعی و ارگانیک از دامنه‌های ارسباران و قره‌داغ.',
  cartEnabled: true,
  cartNotice: 'قیمت و هزینه‌ی ارسال پس از تأیید اعلام می‌شود.',
  orderIntroText: null,
  orderOutroText: null,
  baleBotToken: null,
  baleChatId: null,
  eitaaBotToken: null,
  eitaaChatId: null,
  isPlaceholder: false,
};

export const DEFAULT_CONTACT_CHANNELS: ContactChannelData[] = [
  {
    id: 'ch_phone_main',
    type: 'PHONE',
    value: '09389196010',
    label: 'تماس مستقیم و پیامک',
    isActive: true,
    sortOrder: 0,
    showInContactBar: true,
    showInFooter: true,
    showInContactPage: true,
    acceptsOrders: true,
  },
  {
    id: 'ch_whatsapp_main',
    type: 'WHATSAPP',
    value: '989389196010',
    label: 'واتساپ',
    isActive: true,
    sortOrder: 1,
    showInContactBar: true,
    showInFooter: true,
    showInContactPage: true,
    acceptsOrders: true,
  },
  {
    id: 'ch_telegram_support',
    type: 'TELEGRAM',
    value: 'Babakhoram9',
    label: 'تلگرام (ثبت سفارش و پشتیبانی)',
    isActive: true,
    sortOrder: 2,
    showInContactBar: true,
    showInFooter: true,
    showInContactPage: true,
    acceptsOrders: true,
  },
  {
    id: 'ch_telegram_channel',
    type: 'TELEGRAM',
    value: 'Babakhoramhoney',
    label: 'کانال تلگرام',
    isActive: true,
    sortOrder: 3,
    showInContactBar: true,
    showInFooter: true,
    showInContactPage: true,
    acceptsOrders: false,
  },
  {
    id: 'ch_eitaa_main',
    type: 'EITAA',
    value: 'Babakhoram',
    label: 'ایتا',
    isActive: true,
    sortOrder: 4,
    showInContactBar: true,
    showInFooter: true,
    showInContactPage: true,
    acceptsOrders: true,
  },
  {
    id: 'ch_bale_main',
    type: 'BALE',
    value: 'Babakhoram',
    label: 'بله',
    isActive: true,
    sortOrder: 5,
    showInContactBar: true,
    showInFooter: true,
    showInContactPage: true,
    acceptsOrders: true,
  },
  {
    id: 'ch_instagram_main',
    type: 'INSTAGRAM',
    value: 'baba.khoram.honey',
    label: 'اینستاگرام',
    isActive: true,
    sortOrder: 6,
    showInContactBar: true,
    showInFooter: true,
    showInContactPage: true,
    acceptsOrders: false,
  },
  {
    id: 'ch_youtube_main',
    type: 'YOUTUBE',
    value: 'baba.khoram',
    label: 'یوتیوب',
    isActive: true,
    sortOrder: 7,
    showInContactBar: true,
    showInFooter: true,
    showInContactPage: true,
    acceptsOrders: false,
  },
];

export class SettingsService {
  /**
   * Fetches singleton site settings with safe default fallback
   */
  static async getSettings(): Promise<SiteSettingsData> {
    const raw = await db.siteSettings.findFirst({
      include: { logo: true, footerLogo: true, ogImage: true },
    });
    if (!raw || Object.keys(raw).length === 0) {
      return DEFAULT_SETTINGS;
    }
    const merged: SiteSettingsData = {
      ...DEFAULT_SETTINGS,
      ...raw,
    };

    if (merged.logoId && !merged.logo && typeof db.mediaAsset?.findUnique === 'function') {
      try {
        merged.logo = await db.mediaAsset.findUnique({ where: { id: merged.logoId } });
      } catch {}
    }
    if (merged.footerLogoId && !merged.footerLogo && typeof db.mediaAsset?.findUnique === 'function') {
      try {
        merged.footerLogo = await db.mediaAsset.findUnique({ where: { id: merged.footerLogoId } });
      } catch {}
    }
    if (merged.ogImageId && !merged.ogImage && typeof db.mediaAsset?.findUnique === 'function') {
      try {
        merged.ogImage = await db.mediaAsset.findUnique({ where: { id: merged.ogImageId } });
      } catch {}
    }

    return merged;
  }

  /**
   * Updates site settings with validation, audit logging, and cache revalidation
   */
  static async updateSettings(
    input: Partial<SiteSettingsData>,
    actorUserId?: string,
    ip?: string,
    userAgent?: string
  ): Promise<SiteSettingsData> {
    if (input.orderIntroText && input.orderIntroText.length > 200) {
      throw new Error('متن مقدمه سفارش نباید بیشتر از ۲۰۰ نویسه باشد.');
    }
    if (input.orderOutroText && input.orderOutroText.length > 200) {
      throw new Error('متن پایانی سفارش نباید بیشتر از ۲۰۰ نویسه باشد.');
    }
    if (input.cartNotice && input.cartNotice.length > 500) {
      throw new Error('پیام اطلاع‌رسانی سبد خرید نباید بیشتر از ۵۰۰ نویسه باشد.');
    }

    const { logo, footerLogo, ogImage, ...dataToSave } = input as any;
    if (dataToSave.latitude !== undefined && dataToSave.latitude !== null && dataToSave.latitude !== '') {
      dataToSave.latitude = parseLocalizedNumber(dataToSave.latitude);
    }
    if (dataToSave.longitude !== undefined && dataToSave.longitude !== null && dataToSave.longitude !== '') {
      dataToSave.longitude = parseLocalizedNumber(dataToSave.longitude);
    }
    if (dataToSave.mapZoom !== undefined && dataToSave.mapZoom !== null && dataToSave.mapZoom !== '') {
      dataToSave.mapZoom = parseLocalizedInt(dataToSave.mapZoom);
    }
    const current = await this.getSettings();
    const updated = await db.siteSettings.upsert({
      where: { id: 1 },
      create: { ...DEFAULT_SETTINGS, ...dataToSave, id: 1 },
      update: { ...dataToSave, isPlaceholder: false },
    });

    const changedKeys = Object.keys(input).filter((k) => (input as any)[k] !== (current as any)[k]);

    if (actorUserId) {
      await recordAuditLog({
        userId: actorUserId,
        action: 'UPDATE',
        entityType: 'SiteSettings',
        entityId: '1',
        summary: `بروزرسانی تنظیمات سایت: ${changedKeys.join(', ')}`,
        ip,
        userAgent,
      });
    }

    try {
      (revalidateTag as any)('settings');
      revalidatePath('/', 'layout');
    } catch {}

    return updated;
  }

  /**
   * Fetches contact channels with optional visibility and active filters
   */
  static async getChannels(filter?: {
    onlyActive?: boolean;
    bar?: boolean;
    footer?: boolean;
    contactPage?: boolean;
    acceptsOrders?: boolean;
  }): Promise<ContactChannelData[]> {
    const where: any = {};
    if (filter?.onlyActive !== undefined) where.isActive = filter.onlyActive;
    if (filter?.bar !== undefined) where.showInContactBar = filter.bar;
    if (filter?.footer !== undefined) where.showInFooter = filter.footer;
    if (filter?.contactPage !== undefined) where.showInContactPage = filter.contactPage;
    if (filter?.acceptsOrders !== undefined) where.acceptsOrders = filter.acceptsOrders;

    return db.contactChannel.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Creates a new contact channel with type validation
   */
  static async createChannel(
    data: ContactChannelData,
    actorUserId?: string,
    ip?: string,
    userAgent?: string
  ): Promise<ContactChannelData> {
    const acceptsOrders = data.acceptsOrders ?? false;
    const validation = validateChannel(data.type, data.value, acceptsOrders);
    if (!validation.isValid) {
      throw new Error(validation.errorFa || 'مقدار کانال نامعتبر است.');
    }

    const created = await db.contactChannel.create({
      data: {
        type: data.type,
        value: validation.normalizedValue,
        label: data.label?.trim() || null,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
        showInContactBar: data.showInContactBar ?? true,
        showInFooter: data.showInFooter ?? true,
        showInContactPage: data.showInContactPage ?? true,
        acceptsOrders,
      },
    });

    if (actorUserId) {
      await recordAuditLog({
        userId: actorUserId,
        action: 'CREATE',
        entityType: 'ContactChannel',
        entityId: created.id,
        summary: `ایجاد کانال ارتباطی ${data.type}: ${data.label || validation.normalizedValue}`,
        ip,
        userAgent,
      });
    }

    try {
      (revalidateTag as any)('settings');
      revalidatePath('/', 'layout');
    } catch {}

    return created;
  }

  /**
   * Updates an existing contact channel
   */
  static async updateChannel(
    id: string,
    data: Partial<ContactChannelData>,
    actorUserId?: string,
    ip?: string,
    userAgent?: string
  ): Promise<ContactChannelData> {
    const current = await db.contactChannel.findUnique({ where: { id } });
    if (!current) {
      throw new Error('کانال ارتباطی یافت نشد.');
    }

    const type = data.type || current.type;
    const value = data.value !== undefined ? data.value : current.value;
    const acceptsOrders = data.acceptsOrders !== undefined ? data.acceptsOrders : current.acceptsOrders;

    const validation = validateChannel(type, value, acceptsOrders);
    if (!validation.isValid) {
      throw new Error(validation.errorFa || 'مقدار کانال نامعتبر است.');
    }

    const updated = await db.contactChannel.update({
      where: { id },
      data: {
        ...data,
        type,
        value: validation.normalizedValue,
        acceptsOrders,
      },
    });

    if (actorUserId) {
      const changedKeys = Object.keys(data);
      await recordAuditLog({
        userId: actorUserId,
        action: 'UPDATE',
        entityType: 'ContactChannel',
        entityId: id,
        summary: `ویرایش کانال ارتباطی ${type}: ${changedKeys.join(', ')}`,
        ip,
        userAgent,
      });
    }

    try {
      (revalidateTag as any)('settings');
      revalidatePath('/', 'layout');
    } catch {}

    return updated;
  }

  /**
   * Deletes a contact channel
   */
  static async deleteChannel(
    id: string,
    actorUserId?: string,
    ip?: string,
    userAgent?: string
  ): Promise<void> {
    const current = await db.contactChannel.findUnique({ where: { id } });
    if (!current) return;

    await db.contactChannel.delete({ where: { id } });

    if (actorUserId) {
      await recordAuditLog({
        userId: actorUserId,
        action: 'DELETE',
        entityType: 'ContactChannel',
        entityId: id,
        summary: `حذف کانال ارتباطی ${current.type} (${current.label || current.value})`,
        ip,
        userAgent,
      });
    }

    try {
      (revalidateTag as any)('settings');
      revalidatePath('/', 'layout');
    } catch {}
  }
}
