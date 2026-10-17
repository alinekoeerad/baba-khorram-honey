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

export async function testMessengerConnectionAction(data: {
  platform: 'BALE' | 'EITAA';
  token?: string | null;
  chatId?: string | null;
}) {
  try {
    await requireAdmin({ allowRedirect: false });

    const settings = await SettingsService.getSettings();
    let token = data.token?.trim();
    let chatId = data.chatId?.trim();

    if (data.platform === 'BALE') {
      token = token || settings.baleBotToken?.trim() || process.env.BALE_BOT_TOKEN?.trim();
      chatId = chatId || settings.baleChatId?.trim() || process.env.BALE_CHAT_ID?.trim();

      if (!token) {
        return { success: false, error: 'توکن ربات بله (Bale Bot Token) مشخص نشده است.' };
      }
      if (!chatId) {
        return { success: false, error: 'شناسه چت یا کانال مدیر در بله (Chat ID) مشخص نشده است.' };
      }

      const res = await fetch(`https://tapi.bale.ai/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: '🍯 تست اتصال ربات عسل باباخُرم\nارتباط با وب‌سایت در وضعیت فعال قرار دارد.',
        }),
      });

      const resData = await res.json().catch(() => null);

      if (res.ok && resData?.ok) {
        return {
          success: true,
          message: 'پیام تست با موفقیت از طریق ربات بله ارسال شد.',
        };
      } else {
        const errorMsg = resData?.description || resData?.error_code || res.statusText || 'خطا در ارتباط با سرور بله';
        return {
          success: false,
          error: `خطا در اتصال به ربات بله: ${errorMsg}`,
        };
      }
    } else if (data.platform === 'EITAA') {
      token = token || settings.eitaaBotToken?.trim() || process.env.EITAA_BOT_TOKEN?.trim();
      chatId = chatId || settings.eitaaChatId?.trim() || process.env.EITAA_CHAT_ID?.trim();

      if (!token) {
        return { success: false, error: 'توکن ربات ایتا (Eitaa Bot Token) مشخص نشده است.' };
      }
      if (!chatId) {
        return { success: false, error: 'شناسه چت مدیر در ایتا (Chat ID) مشخص نشده است.' };
      }

      const res = await fetch(`https://eitaayar.ir/api/${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: '🍯 تست اتصال ربات عسل باباخُرم\nارتباط با وب‌سایت در وضعیت فعال قرار دارد.',
        }),
      });

      const resData = await res.json().catch(() => null);

      if (res.ok && (resData?.status === 'success' || resData?.ok)) {
        return {
          success: true,
          message: 'پیام تست با موفقیت از طریق ربات ایتا ارسال شد.',
        };
      } else {
        const errorMsg = resData?.message || resData?.description || res.statusText || 'خطا در ارتباط با سرور ایتا';
        return {
          success: false,
          error: `خطا در اتصال به ربات ایتا: ${errorMsg}`,
        };
      }
    }

    return { success: false, error: 'پلتفرم نامعتبر است.' };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطای شبکه در تست اتصال ربات.' };
  }
}
