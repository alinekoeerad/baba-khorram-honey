/**
 * Admin Settings Page (Phase 5, Task 1)
 * Server component loading settings & channels for the management interface.
 */

import { Metadata } from 'next';
import { requireAdmin } from '@/server/auth/require-admin';
import { SettingsService } from '@/server/services/settings-service';
import { SettingsManager } from './settings-manager';

export const metadata: Metadata = {
  title: 'تنظیمات سایت و کانال‌های ارتباطی | پنل مدیریت',
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  await requireAdmin({ allowRedirect: true });
  const settings = await SettingsService.getSettings();
  const channels = await SettingsService.getChannels();

  return <SettingsManager initialSettings={settings} initialChannels={channels} />;
}
