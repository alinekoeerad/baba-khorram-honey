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
  // Recipe Categories (Brief Section 16)
  {
  "id": "cat_teas-infusions",
  "name": "چای و دمنوش‌ها",
  "slug": "teas-infusions",
  "type": "RECIPE",
  "status": "ACTIVE",
  "sortOrder": 0,
  "createdAt": "2026-10-08T00:00:00.000Z",
  "updatedAt": "2026-10-08T00:00:00.000Z"
},
  {
  "id": "cat_sharbat-fruit-drinks",
  "name": "شربت‌ها و نوشیدنی‌های میوه‌ای",
  "slug": "sharbat-fruit-drinks",
  "type": "RECIPE",
  "status": "ACTIVE",
  "sortOrder": 1,
  "createdAt": "2026-10-08T00:00:00.000Z",
  "updatedAt": "2026-10-08T00:00:00.000Z"
},
  {
  "id": "cat_milk-drinks",
  "name": "نوشیدنی‌های شیری",
  "slug": "milk-drinks",
  "type": "RECIPE",
  "status": "ACTIVE",
  "sortOrder": 2,
  "createdAt": "2026-10-08T00:00:00.000Z",
  "updatedAt": "2026-10-08T00:00:00.000Z"
},
  {
  "id": "cat_grain-seed-drinks",
  "name": "نوشیدنی‌های غلات و دانه‌ها",
  "slug": "grain-seed-drinks",
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
  isPlaceholder: true,
  cartEnabled: true,
  cartNotice: 'قیمت و هزینه‌ی ارسال پس از تأیید اعلام می‌شود.',
  orderIntroText: null,
  orderOutroText: null,
};

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

console.log('----------------------------------------------------');
console.log('✓ Seed data initialized successfully.');
console.log(`✓ Default Categories: ${defaultCategories.length} (2 Product, 4 Recipe)`);
console.log(`✓ Placeholder SiteSettings: «${placeholderSiteSettings.siteNameFa}» (cartEnabled: true, isPlaceholder: true)`);
console.log('----------------------------------------------------');
