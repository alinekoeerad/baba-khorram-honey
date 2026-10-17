/**
 * Settings Manager Client Component (Phase 5, Task 1)
 * Full tabbed settings UI for General, Contact, SEO, and Cart configuration.
 */

'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  SiteSettingsData,
  ContactChannelData,
} from '@/server/services/settings-service';
import {
  updateSiteSettingsAction,
  createContactChannelAction,
  updateContactChannelAction,
  deleteContactChannelAction,
} from '@/server/actions/settings-actions';
import {
  CHANNEL_TYPES_META,
  ChannelType,
  validateChannel,
} from '@/lib/contact-channels';
import {
  Globe,
  PhoneCall,
  Search,
  ShoppingCart,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  Info,
} from 'lucide-react';
import { ConfirmModal } from '@/components/admin/confirm-modal';
import { ImageUploader } from '@/components/admin/image-uploader';
import { useToast } from '@/components/admin/toast-provider';

interface SettingsManagerProps {
  initialSettings: SiteSettingsData;
  initialChannels: ContactChannelData[];
}

export function SettingsManager({
  initialSettings,
  initialChannels,
}: SettingsManagerProps) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<'general' | 'contact' | 'seo' | 'cart'>('general');
  const [settings, setSettings] = useState<SiteSettingsData>(initialSettings);
  const [channels, setChannels] = useState<ContactChannelData[]>(initialChannels);
  const [isPending, startTransition] = useTransition();

  // Channel Modal State
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<ContactChannelData | null>(null);
  const [channelForm, setChannelForm] = useState<{
    type: ChannelType;
    value: string;
    label: string;
    isActive: boolean;
    sortOrder: number;
    showInContactBar: boolean;
    showInFooter: boolean;
    showInContactPage: boolean;
    acceptsOrders: boolean;
  }>({
    type: 'PHONE',
    value: '',
    label: '',
    isActive: true,
    sortOrder: 0,
    showInContactBar: true,
    showInFooter: true,
    showInContactPage: true,
    acceptsOrders: false,
  });
  const [confirmDeleteChannel, setConfirmDeleteChannel] = useState<{ isOpen: boolean; id?: string }>({ isOpen: false });
  const [channelError, setChannelError] = useState<string | null>(null);

  const handleSaveSettings = () => {
    startTransition(async () => {
      const res = await updateSiteSettingsAction(settings);
      if (res.success) {
        showSuccess('تنظیمات با موفقیت ذخیره شد.');
        router.refresh();
      } else {
        showError(res.error || 'خطا در ذخیره تنظیمات.');
      }
    });
  };

  const openNewChannelModal = () => {
    setEditingChannel(null);
    setChannelForm({
      type: 'PHONE',
      value: '',
      label: '',
      isActive: true,
      sortOrder: channels.length,
      showInContactBar: true,
      showInFooter: true,
      showInContactPage: true,
      acceptsOrders: false,
    });
    setChannelError(null);
    setIsChannelModalOpen(true);
  };

  const openEditChannelModal = (ch: ContactChannelData) => {
    setEditingChannel(ch);
    setChannelForm({
      type: ch.type,
      value: ch.value,
      label: ch.label || '',
      isActive: ch.isActive ?? true,
      sortOrder: ch.sortOrder ?? 0,
      showInContactBar: ch.showInContactBar ?? true,
      showInFooter: ch.showInFooter ?? true,
      showInContactPage: ch.showInContactPage ?? true,
      acceptsOrders: ch.acceptsOrders ?? false,
    });
    setChannelError(null);
    setIsChannelModalOpen(true);
  };

  const handleSaveChannel = async () => {
    // Validation
    const validation = validateChannel(channelForm.type, channelForm.value, channelForm.acceptsOrders);
    if (!validation.isValid) {
      setChannelError(validation.errorFa || 'مقدار وارد شده نامعتبر است.');
      return;
    }

    startTransition(async () => {
      if (editingChannel?.id) {
        const res = await updateContactChannelAction(editingChannel.id, {
          ...channelForm,
          value: validation.normalizedValue,
        });
        if (res.success && res.data) {
          setChannels(channels.map((c) => (c.id === editingChannel.id ? res.data! : c)));
          setIsChannelModalOpen(false);
          showSuccess('کانال ارتباطی با موفقیت ویرایش شد.');
          router.refresh();
        } else {
          setChannelError(res.error || 'خطا در ویرایش کانال.');
        }
      } else {
        const res = await createContactChannelAction({
          ...channelForm,
          value: validation.normalizedValue,
        });
        if (res.success && res.data) {
          setChannels([...channels, res.data]);
          setIsChannelModalOpen(false);
          showSuccess('کانال ارتباطی جدید با موفقیت ایجاد شد.');
          router.refresh();
        } else {
          setChannelError(res.error || 'خطا در ایجاد کانال.');
        }
      }
    });
  };

  const handleDeleteChannel = (id: string) => {
    setConfirmDeleteChannel({ isOpen: true, id });
  };

  const handleConfirmDeleteChannel = async () => {
    if (!confirmDeleteChannel.id) return;
    const id = confirmDeleteChannel.id;
    startTransition(async () => {
      const res = await deleteContactChannelAction(id);
      if (res.success) {
        setChannels(channels.filter((c) => c.id !== id));
        showSuccess('کانال ارتباطی حذف شد.');
        setConfirmDeleteChannel({ isOpen: false });
        router.refresh();
      } else {
        showError(res.error || 'خطا در حذف کانال.');
      }
    });
  };

  const selectedMeta = CHANNEL_TYPES_META[channelForm.type];

  return (
    <div className="space-y-6">
      {/* Header & Save Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D5C7B8]">
        <div>
          <h1 className="text-2xl font-black text-[#2B2017]">تنظیمات سایت و ارتباطات</h1>
          <p className="text-sm text-[#5C5248] mt-1">
            مدیریت مشخصات هویتی، آدرس‌ها، کانال‌های دریافت سفارش و درگاه سبد خرید
          </p>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-white px-6 py-2.5 rounded-none font-bold shadow-xs transition-colors disabled:opacity-50 whitespace-nowrap shrink-0 min-w-max cursor-pointer"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>ذخیره تنظیمات</span>
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex gap-2 border-b border-[#D5C7B8] overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-5 py-3 rounded-none text-sm font-bold transition-all border-b-2 whitespace-nowrap shrink-0 min-w-max cursor-pointer ${
            activeTab === 'general'
              ? 'border-[#F59E0B] text-[#D97706] bg-amber-50/50'
              : 'border-transparent text-[#5C5248] hover:text-[#2B2017]'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>عمومی و برندینگ</span>
        </button>
        <button
          onClick={() => setActiveTab('contact')}
          className={`flex items-center gap-2 px-5 py-3 rounded-none text-sm font-bold transition-all border-b-2 whitespace-nowrap shrink-0 min-w-max cursor-pointer ${
            activeTab === 'contact'
              ? 'border-[#F59E0B] text-[#D97706] bg-amber-50/50'
              : 'border-transparent text-[#5C5248] hover:text-[#2B2017]'
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          <span>اطلاعات تماس و کانال‌ها</span>
        </button>
        <button
          onClick={() => setActiveTab('seo')}
          className={`flex items-center gap-2 px-5 py-3 rounded-none text-sm font-bold transition-all border-b-2 whitespace-nowrap shrink-0 min-w-max cursor-pointer ${
            activeTab === 'seo'
              ? 'border-[#F59E0B] text-[#D97706] bg-amber-50/50'
              : 'border-transparent text-[#5C5248] hover:text-[#2B2017]'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>تنظیمات سئو (SEO)</span>
        </button>
        <button
          onClick={() => setActiveTab('cart')}
          className={`flex items-center gap-2 px-5 py-3 rounded-none text-sm font-bold transition-all border-b-2 whitespace-nowrap shrink-0 min-w-max cursor-pointer ${
            activeTab === 'cart'
              ? 'border-[#F59E0B] text-[#D97706] bg-amber-50/50'
              : 'border-transparent text-[#5C5248] hover:text-[#2B2017]'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>سبد خرید و سفارش</span>
        </button>
      </div>

      {/* Tab 1: General */}
      {activeTab === 'general' && (
        <div className="bg-white border border-[#D5C7B8] rounded-none p-6 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-[#2B2017] mb-2">
                نام وب‌سایت به فارسی <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={settings.siteNameFa}
                onChange={(e) => setSettings({ ...settings, siteNameFa: e.target.value })}
                className="w-full bg-[#FDFBF8] border border-[#D5C7B8] rounded-none px-4 py-2.5 text-sm focus:outline-none focus:border-[#F59E0B]"
                placeholder="عسل باباخُرم"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#2B2017] mb-2">
                نام وب‌سایت به انگلیسی
              </label>
              <input
                type="text"
                dir="ltr"
                value={settings.siteNameEn || ''}
                onChange={(e) => setSettings({ ...settings, siteNameEn: e.target.value })}
                className="w-full bg-[#FDFBF8] border border-[#D5C7B8] rounded-none px-4 py-2.5 text-sm text-left focus:outline-none focus:border-[#F59E0B]"
                placeholder="Baba Khorram Honey"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-[#2B2017] mb-2">
                شعار برند (Tagline)
              </label>
              <input
                type="text"
                value={settings.tagline || ''}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full bg-[#FDFBF8] border border-[#D5C7B8] rounded-none px-4 py-2.5 text-sm focus:outline-none focus:border-[#F59E0B]"
                placeholder="طعم اصیل و طبیعی کوهستان"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-[#2B2017] mb-2">
                متن کپی‌رایت فوتر
              </label>
              <input
                type="text"
                value={settings.copyrightText || ''}
                onChange={(e) => setSettings({ ...settings, copyrightText: e.target.value })}
                className="w-full bg-[#FDFBF8] border border-[#D5C7B8] rounded-none px-4 py-2.5 text-sm focus:outline-none focus:border-[#F59E0B]"
                placeholder="تمامی حقوق برای برند عسل باباخُرم محفوظ است. طراحی و توسعه ۱۴۰۵."
              />
            </div>

            {/* Media Uploaders: Logo & Footer Logo */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-[#D5C7B8]">
              <div>
                <label className="block text-sm font-bold text-[#2B2017] mb-2">لوگوی اصلی سایت (Header Logo)</label>
                <ImageUploader
                  value={settings.logo}
                  onChange={(asset) => setSettings({ ...settings, logoId: asset?.id || null, logo: asset })}
                  label="انتخاب یا بارگذاری لوگوی اصلی"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#2B2017] mb-2">لوگوی فوتر سایت (Footer Logo)</label>
                <ImageUploader
                  value={settings.footerLogo}
                  onChange={(asset) => setSettings({ ...settings, footerLogoId: asset?.id || null, footerLogo: asset })}
                  label="انتخاب یا بارگذاری لوگوی فوتر"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Contact & Channels */}
      {activeTab === 'contact' && (
        <div className="space-y-8">
          {/* Physical Address & Working Hours */}
          <div className="bg-white border border-[#D5C7B8] rounded-none p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-black text-[#2B2017] border-b border-[#D5C7B8] pb-3">
              نشانی فیزیکی و ساعات کاری
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-[#2B2017] mb-2">
                  آدرس دفتر / فروشگاه
                </label>
                <textarea
                  rows={2}
                  value={settings.address || ''}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full bg-[#FDFBF8] border border-[#D5C7B8] rounded-none px-4 py-2.5 text-sm focus:outline-none focus:border-[#F59E0B]"
                  placeholder="کرج، جهانشهر، بلوار مولانا"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-[#2B2017] mb-2">
                  ساعات کاری و پاسخگویی
                </label>
                <input
                  type="text"
                  value={settings.workingHours || ''}
                  onChange={(e) => setSettings({ ...settings, workingHours: e.target.value })}
                  className="w-full bg-[#FDFBF8] border border-[#D5C7B8] rounded-none px-4 py-2.5 text-sm focus:outline-none focus:border-[#F59E0B]"
                  placeholder="همه‌روزه از ساعت ۹:۰۰ الی ۲۱:۰۰"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#2B2017] mb-2">
                  عرض جغرافیایی (Latitude)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  dir="ltr"
                  value={settings.latitude ?? ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      latitude: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  className="w-full bg-[#FDFBF8] border border-[#D5C7B8] rounded-none px-4 py-2.5 text-sm text-left focus:outline-none focus:border-[#F59E0B]"
                  placeholder="35.8339878"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#2B2017] mb-2">
                  طول جغرافیایی (Longitude)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  dir="ltr"
                  value={settings.longitude ?? ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      longitude: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  className="w-full bg-[#FDFBF8] border border-[#D5C7B8] rounded-none px-4 py-2.5 text-sm text-left focus:outline-none focus:border-[#F59E0B]"
                  placeholder="50.9915841"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-[#2B2017] mb-2">
                  بزرگ‌نمایی نقشه (Zoom)
                </label>
                <input
                  type="number"
                  min="10"
                  max="18"
                  dir="ltr"
                  value={settings.mapZoom ?? ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      mapZoom: e.target.value ? parseInt(e.target.value, 10) : null,
                    })
                  }
                  className="w-full bg-[#FDFBF8] border border-[#D5C7B8] rounded-none px-4 py-2.5 text-sm text-left focus:outline-none focus:border-[#F59E0B]"
                  placeholder="15"
                />
              </div>
            </div>
          </div>

          {/* Contact Channels Manager */}
          <div className="bg-white border border-[#D5C7B8] rounded-none p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D5C7B8] pb-3">
              <div>
                <h2 className="text-lg font-black text-[#2B2017]">کانال‌های ارتباطی و شبکه‌های اجتماعی</h2>
                <p className="text-xs text-[#5C5248] mt-0.5">
                  کانال‌های فعال در نوار بالای سایت، فوتر و صفحه تماس با ما نمایش داده می‌شوند.
                </p>
              </div>
              <button
                type="button"
                onClick={openNewChannelModal}
                className="inline-flex items-center gap-1.5 bg-[#F59E0B] text-white hover:bg-[#D97706] px-4 py-2 rounded-none text-xs font-bold transition-colors whitespace-nowrap shrink-0 min-w-max cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن کانال جدید</span>
              </button>
            </div>

            {/* Channels Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#D5C7B8] text-xs font-bold text-[#5C5248] bg-[#FDFBF8]">
                    <th className="py-3 px-4">نوع کانال</th>
                    <th className="py-3 px-4">عنوان نمایشی</th>
                    <th className="py-3 px-4">مقدار / شماره</th>
                    <th className="py-3 px-4 text-center">محل نمایش</th>
                    <th className="py-3 px-4 text-center">دریافت سفارش</th>
                    <th className="py-3 px-4 text-center">وضعیت</th>
                    <th className="py-3 px-4 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D5C7B8]">
                  {channels.map((ch) => (
                    <tr key={ch.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#2B2017]">
                        {CHANNEL_TYPES_META[ch.type]?.titleFa || ch.type}
                      </td>
                      <td className="py-3 px-4 text-[#5C5248]">{ch.label || '—'}</td>
                      <td className="py-3 px-4 text-[#2B2017] font-mono text-xs" dir="ltr">
                        {ch.value}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex gap-1 text-[11px] font-bold">
                          {ch.showInContactBar && (
                            <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-none">نوار بالا</span>
                          )}
                          {ch.showInFooter && (
                            <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded-none">فوتر</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {ch.acceptsOrders ? (
                          <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-none text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                            <span>فعال</span>
                          </span>
                        ) : (
                          <span className="text-stone-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {ch.isActive ? (
                          <span className="text-emerald-800 font-bold text-xs bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-none">فعال</span>
                        ) : (
                          <span className="text-stone-500 font-bold text-xs bg-stone-100 px-2 py-0.5 rounded-none">غیرفعال</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditChannelModal(ch)}
                            className="p-1.5 text-stone-600 hover:text-amber-700 hover:bg-amber-50 rounded-none transition-colors cursor-pointer"
                            title="ویرایش"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => ch.id && handleDeleteChannel(ch.id)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-none transition-colors cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {channels.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-[#5C5248]">
                        هیچ کانال ارتباطی ثبت نشده است.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: SEO */}
      {activeTab === 'seo' && (
        <div className="bg-white border border-[#D5C7B8] rounded-none p-6 shadow-sm space-y-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-[#2B2017] mb-2">
                عنوان پیش‌فرض سئو (SEO Title)
              </label>
              <input
                type="text"
                value={settings.seoTitle || ''}
                onChange={(e) => setSettings({ ...settings, seoTitle: e.target.value })}
                className="w-full bg-[#FDFBF8] border border-[#D5C7B8] rounded-none px-4 py-2.5 text-sm focus:outline-none focus:border-[#F59E0B]"
                placeholder="عسل باباخُرم | طعم اصیل و طبیعی کوهستان"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#2B2017] mb-2">
                توضیحات پیش‌فرض متا (SEO Meta Description)
              </label>
              <textarea
                rows={3}
                value={settings.seoDescription || ''}
                onChange={(e) => setSettings({ ...settings, seoDescription: e.target.value })}
                className="w-full bg-[#FDFBF8] border border-[#D5C7B8] rounded-none px-4 py-2.5 text-sm focus:outline-none focus:border-[#F59E0B]"
                placeholder="تولید و عرضه مستقیم انواع عسل طبیعی و ارگانیک از دامنه‌های ارسباران و قره‌داغ."
              />
            </div>

            {/* OG Image Uploader */}
            <div className="pt-4 border-t border-[#D5C7B8]">
              <label className="block text-sm font-bold text-[#2B2017] mb-2">
                تصویر پیش‌فرض اشتراک‌گذاری شبکه‌های اجتماعی (OpenGraph Image)
              </label>
              <ImageUploader
                value={settings.ogImage}
                onChange={(asset) => setSettings({ ...settings, ogImageId: asset?.id || null, ogImage: asset })}
                label="انتخاب یا بارگذاری تصویر اشتراک‌گذاری سئو"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Cart & Orders */}
      {activeTab === 'cart' && (
        <div className="bg-white border border-[#D5C7B8] rounded-none p-6 shadow-sm space-y-6">
          {/* Zero Active Order Channels Safety Warning */}
          {settings.cartEnabled && channels.filter((c) => c.isActive && c.acceptsOrders).length === 0 && (
            <div className="p-4 bg-amber-50 border-2 border-amber-500 rounded-none text-amber-950 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-black text-sm text-amber-950 mb-1">
                  هشدار: هیچ کانال فعالی برای دریافت سفارش تنظیم نشده است!
                </h4>
                <p className="text-xs text-amber-900 leading-relaxed font-semibold">
                  سبد خرید فعال است، اما هیچ کانال ارتباطی فعالی با گزینه «دریافت سفارش» فعال نیست. لطفاً در تب «اطلاعات تماس و کانال‌ها» حداقل یک کانال فعال (مانند واتساپ، ایتا، بله یا تلگرام) را به عنوان پذیرنده سفارش علامت‌گذاری نمایید تا فرآیند ثبت سفارش مشتریان تکمیل گردد.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-amber-50/60 border border-amber-200 rounded-none">
            <div className="space-y-0.5">
              <h3 className="text-base font-bold text-[#2B2017]">فعال‌سازی سبد خرید و ثبت سفارش آنلاین</h3>
              <p className="text-xs text-[#5C5248]">
                در صورت فعال بودن، آیکون سبد خرید در هدر و دکمه‌های افزودن به سبد در صفحات محصولات نمایش داده می‌شوند.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.cartEnabled}
                onChange={(e) => setSettings({ ...settings, cartEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-none after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3F8F3B]"></div>
            </label>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-[#2B2017] mb-2">
                پیام اطلاع‌رسانی سبد خرید (Cart Notice)
              </label>
              <textarea
                rows={2}
                value={settings.cartNotice}
                onChange={(e) => setSettings({ ...settings, cartNotice: e.target.value })}
                className="w-full bg-[#FDFBF8] border border-[#D5C7B8] rounded-none px-4 py-2.5 text-sm focus:outline-none focus:border-[#F59E0B]"
                placeholder="قیمت و هزینه‌ی ارسال پس از تأیید اعلام می‌شود."
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-[#2B2017]">
                  متن مقدمه سفارش ارسالی (Order Intro Text)
                </label>
                <span className="text-xs text-[#5C5248]">
                  {(settings.orderIntroText?.length || 0)} / ۲۰۰ نویسه
                </span>
              </div>
              <textarea
                rows={2}
                maxLength={200}
                value={settings.orderIntroText || ''}
                onChange={(e) => setSettings({ ...settings, orderIntroText: e.target.value })}
                className="w-full bg-[#FDFBF8] border border-[#D5C7B8] rounded-none px-4 py-2.5 text-sm focus:outline-none focus:border-[#F59E0B]"
                placeholder="سلام، مایلم سفارش زیر را ثبت نمایم:"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-[#2B2017]">
                  متن پایانی سفارش ارسالی (Order Outro Text)
                </label>
                <span className="text-xs text-[#5C5248]">
                  {(settings.orderOutroText?.length || 0)} / ۲۰۰ نویسه
                </span>
              </div>
              <textarea
                rows={2}
                maxLength={200}
                value={settings.orderOutroText || ''}
                onChange={(e) => setSettings({ ...settings, orderOutroText: e.target.value })}
                className="w-full bg-[#FDFBF8] border border-[#D5C7B8] rounded-none px-4 py-2.5 text-sm focus:outline-none focus:border-[#F59E0B]"
                placeholder="لطفاً پیش‌فاکتور و اطلاعات پرداخت را برای من ارسال فرمایید."
              />
            </div>
          </div>
        </div>
      )}

      {/* Channel Create/Edit Modal */}
      {isChannelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border-2 border-stone-300 rounded-none p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-black text-[#2B2017] border-b border-[#D5C7B8] pb-3">
              {editingChannel ? 'ویرایش کانال ارتباطی' : 'افزودن کانال ارتباطی جدید'}
            </h3>

            {channelError && (
              <div className="p-3 rounded-none bg-red-50 border-2 border-red-600 text-red-950 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-700" />
                <span>{channelError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2B2017] mb-1.5">نوع پلتفرم / شبکه</label>
                <select
                  value={channelForm.type}
                  onChange={(e) => {
                    const newType = e.target.value as ChannelType;
                    setChannelForm({
                      ...channelForm,
                      type: newType,
                      acceptsOrders: (newType === 'INSTAGRAM' || newType === 'YOUTUBE') ? false : channelForm.acceptsOrders,
                    });
                  }}
                  className="w-full bg-[#FDFBF8] border border-[#D5C7B8] rounded-none px-3 py-2 text-sm focus:outline-none focus:border-[#F59E0B]"
                >
                  {Object.values(CHANNEL_TYPES_META).map((m) => (
                    <option key={m.type} value={m.type}>
                      {m.titleFa}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B2017] mb-1.5">
                  مقدار / شماره یا شناسه کاربری <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={channelForm.value}
                  onChange={(e) => setChannelForm({ ...channelForm, value: e.target.value })}
                  placeholder={selectedMeta.placeholderFa}
                  className="w-full bg-[#FDFBF8] border border-[#D5C7B8] rounded-none px-3 py-2 text-sm text-left font-mono focus:outline-none focus:border-[#F59E0B]"
                />
                <span className="text-[11px] text-[#5C5248] mt-1 block">
                  مثال: <span dir="ltr">{selectedMeta.example}</span>
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B2017] mb-1.5">عنوان نمایشی اختیاری</label>
                <input
                  type="text"
                  value={channelForm.label}
                  onChange={(e) => setChannelForm({ ...channelForm, label: e.target.value })}
                  placeholder={selectedMeta.defaultLabel}
                  className="w-full bg-[#FDFBF8] border border-[#D5C7B8] rounded-none px-3 py-2 text-sm focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              {/* Order Channel Toggle (Addendum A2) */}
              <div className="p-3.5 bg-amber-50/50 border border-amber-300 rounded-none space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channelForm.acceptsOrders}
                    disabled={channelForm.type === 'INSTAGRAM' || channelForm.type === 'YOUTUBE'}
                    onChange={(e) => setChannelForm({ ...channelForm, acceptsOrders: e.target.checked })}
                    className="w-4 h-4 rounded-none text-[#3F8F3B] focus:ring-0 disabled:opacity-50"
                  />
                  <span
                    className={`text-xs font-bold ${
                      channelForm.type === 'INSTAGRAM' || channelForm.type === 'YOUTUBE' ? 'text-stone-400' : 'text-[#2B2017]'
                    }`}
                  >
                    پذیرش و ارسال سفارشات سبد خرید در این کانال
                  </span>
                </label>
                {selectedMeta.orderChannelHintFa && (
                  <p className="text-[11px] text-[#5C5248] flex items-start gap-1">
                    <Info className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                    <span>{selectedMeta.orderChannelHintFa}</span>
                  </p>
                )}
              </div>

              {/* Visibility Options */}
              <div className="grid grid-cols-2 gap-2 text-xs font-medium text-[#2B2017]">
                <label className="flex items-center gap-2 p-2 bg-[#FDFBF8] border border-[#D5C7B8] rounded-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channelForm.showInContactBar}
                    onChange={(e) => setChannelForm({ ...channelForm, showInContactBar: e.target.checked })}
                    className="w-4 h-4 rounded-none text-[#F59E0B]"
                  />
                  <span>نوار بالای سایت</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-[#FDFBF8] border border-[#D5C7B8] rounded-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channelForm.showInFooter}
                    onChange={(e) => setChannelForm({ ...channelForm, showInFooter: e.target.checked })}
                    className="w-4 h-4 rounded-none text-[#F59E0B]"
                  />
                  <span>فوتر سایت</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-[#FDFBF8] border border-[#D5C7B8] rounded-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channelForm.showInContactPage}
                    onChange={(e) => setChannelForm({ ...channelForm, showInContactPage: e.target.checked })}
                    className="w-4 h-4 rounded-none text-[#F59E0B]"
                  />
                  <span>صفحه تماس با ما</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-[#FDFBF8] border border-[#D5C7B8] rounded-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channelForm.isActive}
                    onChange={(e) => setChannelForm({ ...channelForm, isActive: e.target.checked })}
                    className="w-4 h-4 rounded-none text-[#3F8F3B]"
                  />
                  <span className="font-bold text-emerald-800">کانال فعال باشد</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-[#D5C7B8] pt-4">
              <button
                type="button"
                onClick={() => setIsChannelModalOpen(false)}
                className="px-4 py-2 border border-[#D5C7B8] rounded-none text-xs font-bold text-[#5C5248] hover:bg-stone-50 transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleSaveChannel}
                disabled={isPending}
                className="px-5 py-2 bg-[#3F8F3B] hover:bg-[#347831] text-white rounded-none text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap min-w-max"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{editingChannel ? 'ذخیره تغییرات' : 'افزودن کانال'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* [ADM-UI-01] Universal ConfirmModal */}
      <ConfirmModal
        isOpen={confirmDeleteChannel.isOpen}
        title="حذف کانال ارتباطی"
        message="آیا از حذف این کانال ارتباطی مطمئن هستید؟"
        confirmLabel="بله، حذف کن"
        cancelLabel="انصراف"
        isLoading={isPending}
        onConfirm={handleConfirmDeleteChannel}
        onCancel={() => setConfirmDeleteChannel({ isOpen: false })}
      />
    </div>
  );
}
