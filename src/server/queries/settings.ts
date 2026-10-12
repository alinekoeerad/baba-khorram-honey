/**
 * Public Settings & Contact Channels Query Helpers (Phase 5, Task 2 & 5)
 * Reads cached settings and active contact channels for the public site shell.
 */

import { SettingsService, SiteSettingsData, ContactChannelData } from '../services/settings-service';
import { buildChannelUrl } from '@/lib/contact-channels';

export interface PublicChannelItem extends ContactChannelData {
  url: string;
}

export async function getPublicSiteSettings(): Promise<SiteSettingsData> {
  return SettingsService.getSettings();
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
