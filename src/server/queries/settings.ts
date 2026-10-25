/**
 * Public Settings & Contact Channels Query Helpers (Phase 5, Task 2 & 5)
 * Reads cached settings and active contact channels for the public site shell.
 */

import { SettingsService, SiteSettingsData, ContactChannelData } from '../services/settings-service';
import { buildChannelUrl } from '@/lib/contact-channels';

export interface PublicChannelItem extends ContactChannelData {
  url: string;
}

/**
 * Minimal public media asset projection for public site chrome (logo, footerLogo, ogImage).
 * Strictly exposes only presentation fields and eliminates `any`.
 */
export interface PublicMediaAssetInfo {
  url?: string | null;
  storageKey?: string | null;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
}

/**
 * Helper to safely project a media asset into PublicMediaAssetInfo.
 */
export function toPublicMediaAsset(asset: any): PublicMediaAssetInfo | null {
  if (!asset) return null;
  if (typeof asset === 'string') {
    return { url: asset };
  }
  return {
    url: asset.url ?? (asset.storageKey ? `/uploads/${encodeURIComponent(asset.storageKey)}` : null),
    storageKey: asset.storageKey ?? null,
    alt: asset.alt ?? null,
    width: typeof asset.width === 'number' ? asset.width : null,
    height: typeof asset.height === 'number' ? asset.height : null,
  };
}

/**
 * Standalone public-facing settings contract.
 * Strictly defines only the fields intended for public client consumption.
 * Any secret/internal field added to SiteSettingsData will NOT be included here.
 */
export interface PublicSiteSettings {
  id: number;
  siteNameFa: string;
  siteNameEn: string | null;
  tagline: string | null;
  logoId: string | null;
  logo: PublicMediaAssetInfo | null;
  footerLogoId: string | null;
  footerLogo: PublicMediaAssetInfo | null;
  ogImageId: string | null;
  ogImage: PublicMediaAssetInfo | null;
  address: string | null;
  workingHours: string | null;
  latitude: number | null;
  longitude: number | null;
  mapZoom: number | null;
  copyrightText: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  cartEnabled: boolean;
  cartNotice: string;
  orderIntroText: string | null;
  orderOutroText: string | null;
  isPlaceholder: boolean;
}

/**
 * Explicit allowlist projection function.
 * Picks exclusively safe public fields to prevent any secret leakages (F1).
 */
export function toPublicSiteSettings(settings: SiteSettingsData): PublicSiteSettings {
  return {
    id: settings.id ?? 1,
    siteNameFa: settings.siteNameFa,
    siteNameEn: settings.siteNameEn ?? null,
    tagline: settings.tagline ?? null,
    logoId: settings.logoId ?? null,
    logo: toPublicMediaAsset(settings.logo),
    footerLogoId: settings.footerLogoId ?? null,
    footerLogo: toPublicMediaAsset(settings.footerLogo),
    ogImageId: settings.ogImageId ?? null,
    ogImage: toPublicMediaAsset(settings.ogImage),
    address: settings.address ?? null,
    workingHours: settings.workingHours ?? null,
    latitude: settings.latitude ?? null,
    longitude: settings.longitude ?? null,
    mapZoom: settings.mapZoom ?? null,
    copyrightText: settings.copyrightText ?? null,
    seoTitle: settings.seoTitle ?? null,
    seoDescription: settings.seoDescription ?? null,
    cartEnabled: Boolean(settings.cartEnabled),
    cartNotice: settings.cartNotice ?? 'قیمت و هزینه‌ی ارسال پس از تأیید اعلام می‌شود.',
    orderIntroText: settings.orderIntroText ?? null,
    orderOutroText: settings.orderOutroText ?? null,
    isPlaceholder: Boolean(settings.isPlaceholder),
  };
}

export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  const full = await SettingsService.getSettings();
  return toPublicSiteSettings(full);
}

export async function getPublicContactChannels(): Promise<{
  contactBarChannels: PublicChannelItem[];
  footerChannels: PublicChannelItem[];
  orderChannels: PublicChannelItem[];
}> {
  const activeChannels = await SettingsService.getChannels({ onlyActive: true });

  const contactBarChannels = activeChannels
    .filter((ch) => ch.showInContactBar)
    .map((ch) => ({ ...ch, url: buildChannelUrl(ch.type, ch.value) }));

  const footerChannels = activeChannels
    .filter((ch) => ch.showInFooter)
    .map((ch) => ({ ...ch, url: buildChannelUrl(ch.type, ch.value) }));

  const orderChannels = activeChannels
    .filter((ch) => ch.acceptsOrders)
    .map((ch) => ({ ...ch, url: buildChannelUrl(ch.type, ch.value) }));

  return {
    contactBarChannels,
    footerChannels,
    orderChannels,
  };
}
