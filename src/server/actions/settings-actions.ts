/**
 * Settings & Contact Channels Server Actions (Phase 5, Task 1)
 * Admin-protected actions for site configuration and channel management.
 */

'use server';

import { requireAdmin } from '@/server/auth/require-admin';
import { SettingsService, SiteSettingsData, ContactChannelData } from '@/server/services/settings-service';

export async function updateSiteSettingsAction(input: Partial<SiteSettingsData>) {
  try {
    const { user } = await requireAdmin({ allowRedirect: false });
    const settings = await SettingsService.updateSettings(input, user.id);
    return { success: true, data: settings };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطا در ذخیره‌سازی تنظیمات.' };
  }
}

export async function createContactChannelAction(input: ContactChannelData) {
  try {
    const { user } = await requireAdmin({ allowRedirect: false });
    const channel = await SettingsService.createChannel(input, user.id);
    return { success: true, data: channel };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطا در ایجاد کانال ارتباطی.' };
  }
}

export async function updateContactChannelAction(id: string, input: Partial<ContactChannelData>) {
  try {
    const { user } = await requireAdmin({ allowRedirect: false });
    const channel = await SettingsService.updateChannel(id, input, user.id);
    return { success: true, data: channel };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطا در ویرایش کانال ارتباطی.' };
  }
}

export async function deleteContactChannelAction(id: string) {
  try {
    const { user } = await requireAdmin({ allowRedirect: false });
    await SettingsService.deleteChannel(id, user.id);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطا در حذف کانال ارتباطی.' };
  }
}
