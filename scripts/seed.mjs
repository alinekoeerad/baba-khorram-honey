#!/usr/bin/env node

/**
 * Seed Script (Phase 1, Dev Only)
 * Creates default product and recipe categories and placeholder SiteSettings row.
 * Idempotent execution.
 */

import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const seedDir = path.join(rootDir, 'data/seed');

const defaultCategories = [
  // Product Categories (Brief Section 16)
  {
  "id": "cat_honey-types",
  "name": "انواع عسل",
  "slug": "honey-types",
  "type": "PRODUCT",
  "status": "ACTIVE",
  "sortOrder": 0,
  "createdAt": "2026-10-08T00:00:00.000Z",
  "updatedAt": "2026-10-08T00:00:00.000Z"
},
  {
  "id": "cat_other-bee-products",
  "name": "فرآورده‌های دیگر زنبور",
  "slug": "other-bee-products",
  "type": "PRODUCT",
  "status": "ACTIVE",
  "sortOrder": 1,
  "createdAt": "2026-10-08T00:00:00.000Z",
  "updatedAt": "2026-10-08T00:00:00.000Z"
},
  // Official Recipe Categories (Client Export)
  {
    "id": "cat_drinks",
    "name": "نوشیدنی",
    "slug": "drinks",
    "type": "RECIPE",
    "status": "ACTIVE",
    "sortOrder": 0,
    "createdAt": "2026-10-08T00:00:00.000Z",
    "updatedAt": "2026-10-08T00:00:00.000Z"
  },
  {
    "id": "cat_desserts",
    "name": "دسر",
    "slug": "desserts",
    "type": "RECIPE",
    "status": "ACTIVE",
    "sortOrder": 1,
    "createdAt": "2026-10-08T00:00:00.000Z",
    "updatedAt": "2026-10-08T00:00:00.000Z"
  },
  {
    "id": "cat_breakfast",
    "name": "صبحانه",
    "slug": "breakfast",
    "type": "RECIPE",
    "status": "ACTIVE",
    "sortOrder": 2,
    "createdAt": "2026-10-08T00:00:00.000Z",
    "updatedAt": "2026-10-08T00:00:00.000Z"
  },
  {
    "id": "cat_pastries",
    "name": "کیک و شیرینی",
    "slug": "pastries",
    "type": "RECIPE",
    "status": "ACTIVE",
    "sortOrder": 3,
    "createdAt": "2026-10-08T00:00:00.000Z",
    "updatedAt": "2026-10-08T00:00:00.000Z"
  },
];

const placeholderSiteSettings = {
  id: 1,
  siteNameFa: 'عسل باباخُرم',
  siteNameEn: 'Baba Khorram Honey',
  tagline: 'طعم اصیل و طبیعی کوهستان',
  isPlaceholder: false,
  cartEnabled: true,
  cartNotice: 'قیمت و هزینه‌ی ارسال پس از تأیید اعلام می‌شود.',
  orderIntroText: null,
  orderOutroText: null,
  logoId: null,
  footerLogoId: null,
  ogImageId: null,
  address: 'کرج، جهانشهر، بلوار مولانا',
  workingHours: 'همه‌روزه از ساعت ۹:۰۰ الی ۲۱:۰۰',
  latitude: 35.8415,
  longitude: 50.9850,
  mapZoom: 15,
  copyrightText: 'تمامی حقوق برای برند عسل باباخُرم محفوظ است. طراحی و توسعه ۱۴۰۵.',
  seoTitle: 'عسل باباخُرم | طعم اصیل و طبیعی کوهستان',
  seoDescription: 'تولید و عرضه مستقیم انواع عسل طبیعی و ارگانیک از دامنه‌های ارسباران و قره‌داغ.',
};

const defaultContactChannels = [
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
    createdAt: '2026-10-08T00:00:00.000Z',
    updatedAt: '2026-10-08T00:00:00.000Z',
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
    createdAt: '2026-10-08T00:00:00.000Z',
    updatedAt: '2026-10-08T00:00:00.000Z',
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
    createdAt: '2026-10-08T00:00:00.000Z',
    updatedAt: '2026-10-08T00:00:00.000Z',
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
    createdAt: '2026-10-08T00:00:00.000Z',
    updatedAt: '2026-10-08T00:00:00.000Z',
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
    createdAt: '2026-10-08T00:00:00.000Z',
    updatedAt: '2026-10-08T00:00:00.000Z',
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
    createdAt: '2026-10-08T00:00:00.000Z',
    updatedAt: '2026-10-08T00:00:00.000Z',
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
    createdAt: '2026-10-08T00:00:00.000Z',
    updatedAt: '2026-10-08T00:00:00.000Z',
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
    createdAt: '2026-10-08T00:00:00.000Z',
    updatedAt: '2026-10-08T00:00:00.000Z',
  },
];

// Save structured seed files
if (!fs.existsSync(seedDir)) {
  fs.mkdirSync(seedDir, { recursive: true });
}
fs.writeFileSync(
  path.join(seedDir, 'categories.json'),
  JSON.stringify(defaultCategories, null, 2),
  'utf8'
);
fs.writeFileSync(
  path.join(seedDir, 'site-settings.json'),
  JSON.stringify(placeholderSiteSettings, null, 2),
  'utf8'
);
fs.writeFileSync(
  path.join(seedDir, 'contact-channels.json'),
  JSON.stringify(defaultContactChannels, null, 2),
  'utf8'
);

console.log('----------------------------------------------------');
console.log('✓ Seed data initialized successfully.');
console.log(`✓ Default Categories: ${defaultCategories.length} (2 Product, 4 Recipe)`);
console.log(`✓ Default Contact Channels: ${defaultContactChannels.length} production channels`);
console.log(`✓ Placeholder SiteSettings: «${placeholderSiteSettings.siteNameFa}» (cartEnabled: true, isPlaceholder: true)`);
console.log('----------------------------------------------------');
