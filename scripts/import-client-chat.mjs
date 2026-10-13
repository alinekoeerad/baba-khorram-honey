#!/usr/bin/env node

/**
 * Client Chat Data & Asset Import Script
 * Imports verified client export (ChatExport_2026-10-11):
 * 1. Copies & optimizes photos 1..31 to public/images/products/
 * 2. Copies hero slider photos 32..38 & feature photo 39 to public/images/hero/ (with photo_35 as first slide)
 * 3. Updates data/seed/products.json with full 31 products, imageUrl, and PUBLISHED status
 * 4. Updates data/seed/categories.json with exact 4 recipe categories (drinks, desserts, breakfast, pastries)
 * 5. Updates data/seed/recipes.json with new category mapping
 * 6. Updates data/seed/homepage-sections.json with hero slider and feature image
 */

import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const chatExportDir = 'd:/Project/honey/honey-website/honey-website/ChatExport_2026-10-11';
const chatPhotosDir = path.join(chatExportDir, 'photos');
const publicProductsDir = path.join(rootDir, 'public/images/products');
const publicHeroDir = path.join(rootDir, 'public/images/hero');
const seedDir = path.join(rootDir, 'data/seed');

console.log('====================================================');
console.log('🐝 Starting Client Chat Data & Asset Import');
console.log('====================================================');

// Ensure destination directories exist
[publicProductsDir, publicHeroDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✓ Created directory: ${dir}`);
  }
});

// Map high-res photos from ChatExport
const photoFiles = fs.readdirSync(chatPhotosDir);
const photoMap = new Map();

for (const file of photoFiles) {
  if (file.endsWith('_thumb.jpg') || file.includes('_thumb')) continue;
  const match = file.match(/^photo_(\d+)@.*\.jpg$/);
  if (match) {
    const num = parseInt(match[1], 10);
    photoMap.set(num, path.join(chatPhotosDir, file));
  }
}

console.log(`✓ Located ${photoMap.size} high-resolution photos in ChatExport/photos/`);

// 31 Products Mapping
const productList = [
  { index: 1, slug: 'saffron', nameFa: 'عسل زعفران', nameOriginal: 'SAFFRON', aliases: [] },
  { index: 2, slug: 'berberrise', nameFa: 'عسل زرشک', nameOriginal: 'BERBERRISE', aliases: [] },
  { index: 3, slug: 'catton', nameFa: 'عسل پنبه', nameOriginal: 'CATTON', aliases: [] },
  { index: 4, slug: 'citrus-bigaradia', nameFa: 'عسل بهارنارنج', nameOriginal: 'CITRUS BIGARADIA', aliases: [] },
  { index: 5, slug: 'almond', nameFa: 'عسل بادام', nameOriginal: 'ALMOND', aliases: [] },
  { index: 6, slug: 'sumac', nameFa: 'عسل سماق', nameOriginal: 'SUMAC', aliases: [] },
  { index: 7, slug: 'eucalyptus', nameFa: 'عسل اکالیپتوس (کینا)', nameOriginal: 'EUCALYPTUS', aliases: [] },
  { index: 8, slug: 'nigella-sativa', nameFa: 'عسل سیاهدانه', nameOriginal: 'NIGELLA SATIVA', aliases: [] },
  { index: 9, slug: 'sesame', nameFa: 'عسل کنجد', nameOriginal: 'SESAME', aliases: [] },
  { index: 10, slug: 'enchinops', nameFa: 'عسل قنقال (تیغال)', nameOriginal: 'ENCHINOPS', aliases: ['echinops'] },
  { index: 11, slug: 'ergngium', nameFa: 'عسل بوقناق (زول)', nameOriginal: 'ERGNGIUM', aliases: ['eryngium'] },
  { index: 12, slug: 'cirsium', nameFa: 'عسل زنجیرخار (خارکیوار)', nameOriginal: 'CIRSIUM', aliases: [] },
  { index: 13, slug: 'chestnut', nameFa: 'عسل شاه بلوط', nameOriginal: 'CHESTNUT', aliases: [] },
  { index: 14, slug: 'acacia', nameFa: 'عسل اقاقیا', nameOriginal: 'ACACIA', aliases: [] },
  { index: 15, slug: 'officinalis', nameFa: 'عسل مریم گلی', nameOriginal: 'OFFICINALIS', aliases: [] },
  { index: 16, slug: 'alfalfa', nameFa: 'عسل یونجه', nameOriginal: 'ALFALFA', aliases: [] },
  { index: 17, slug: 'coriandrum', nameFa: 'عسل گشنیز', nameOriginal: 'CORIANDRUM', aliases: [] },
  { index: 18, slug: 'parsley', nameFa: 'عسل جعفری', nameOriginal: 'PARSLEY', aliases: [] },
  { index: 19, slug: 'dill', nameFa: 'عسل شوید', nameOriginal: 'DILL', aliases: [] },
  { index: 20, slug: 'five-finger', nameFa: 'عسل پنج انگشت (فلفل بیابانی)', nameOriginal: 'FIVE FINGER', aliases: [] },
  { index: 21, slug: 'ajwain', nameFa: 'عسل زنیان (انیسون بری)', nameOriginal: 'AJWAIN', aliases: [] },
  { index: 22, slug: 'oregano-cow', nameFa: 'عسل گاوپونه (گل اروانه)', nameOriginal: 'OREGANO COW', aliases: [] },
  { index: 23, slug: 'thymus', nameFa: 'عسل آویشن', nameOriginal: 'THYMUS', aliases: [] },
  { index: 24, slug: 'astragalus', nameFa: 'عسل گَوَن کتیرا (گَوَن زرد)', nameOriginal: 'ASTRAGALUS', aliases: [] },
  { index: 25, slug: 'foeniculum', nameFa: 'عسل رازیانه (بادیان)', nameOriginal: 'FOENICULUM', aliases: [] },
  { index: 26, slug: 'astagalus', nameFa: 'عسل گَوَن گَزاَنگبین (گَوَن گز)', nameOriginal: 'ASTAGALUS', aliases: ['astragalus-gaz'] },
  { index: 27, slug: 'ziziphus', nameFa: 'عسل کُنار (سدر)', nameOriginal: 'ZIZIPHUS', aliases: [] },
  { index: 28, slug: 'jujube', nameFa: 'عسل عناب', nameOriginal: 'JUJUBE', aliases: [] },
  { index: 29, slug: 'multi-plants', nameFa: 'عسل چند گیاه', nameOriginal: 'MULTI PLANTS', aliases: [] },
  { index: 30, slug: 'pollen', nameFa: 'گرده گل', nameOriginal: 'POLLEN', aliases: [] },
  { index: 31, slug: 'royal-gelly', nameFa: 'رویال ژل', nameOriginal: 'ROYAL GELLY', aliases: ['royal-jelly'] },
];

// Copy product photos
for (const p of productList) {
  const src = photoMap.get(p.index);
  if (!src) {
    console.error(`❌ Missing photo for product index ${p.index} (${p.slug})`);
    continue;
  }
  const dest = path.join(publicProductsDir, `${p.slug}.jpg`);
  fs.copyFileSync(src, dest);
  for (const alias of p.aliases) {
    fs.copyFileSync(src, path.join(publicProductsDir, `${alias}.jpg`));
  }
}
console.log(`✓ Copied 31 product photos (plus aliases) to public/images/products/`);

// Copy Hero Slider photos (photo_32 through photo_38)
for (let num = 32; num <= 38; num++) {
  const src = photoMap.get(num);
  if (src) {
    fs.copyFileSync(src, path.join(publicHeroDir, `photo_${num}.jpg`));
  }
}
// Feature photo 39 directly below hero slider
const photo39 = photoMap.get(39);
if (photo39) {
  fs.copyFileSync(photo39, path.join(publicHeroDir, 'feature-honey.jpg'));
  console.log(`✓ Copied photo_39 to public/images/hero/feature-honey.jpg`);
}
console.log(`✓ Copied hero slider photos (photo_32 through photo_38) to public/images/hero/`);

// 1. Update data/seed/products.json
const productsJsonPath = path.join(seedDir, 'products.json');
const products = JSON.parse(fs.readFileSync(productsJsonPath, 'utf8'));

for (const p of products) {
  p.imageUrl = `/images/products/${p.slug}.jpg`;
  p.status = 'PUBLISHED';
  p.isAvailable = true;
}

fs.writeFileSync(productsJsonPath, JSON.stringify(products, null, 2), 'utf8');
console.log(`✓ Updated data/seed/products.json: set imageUrl & PUBLISHED status for all 31 items`);

// 2. Update data/seed/categories.json with 4 client recipe categories
const categoriesJsonPath = path.join(seedDir, 'categories.json');
const categories = [
  {
    id: 'cat_honey-types',
    name: 'انواع عسل',
    slug: 'honey-types',
    type: 'PRODUCT',
    status: 'ACTIVE',
    sortOrder: 0,
    createdAt: '2026-10-08T00:00:00.000Z',
    updatedAt: '2026-10-08T00:00:00.000Z',
  },
  {
    id: 'cat_other-bee-products',
    name: 'فرآورده‌های دیگر زنبور',
    slug: 'other-bee-products',
    type: 'PRODUCT',
    status: 'ACTIVE',
    sortOrder: 1,
    createdAt: '2026-10-08T00:00:00.000Z',
    updatedAt: '2026-10-08T00:00:00.000Z',
  },
  {
    id: 'cat_drinks',
    name: 'نوشیدنی',
    slug: 'drinks',
    type: 'RECIPE',
    status: 'ACTIVE',
    sortOrder: 0,
    createdAt: '2026-10-08T00:00:00.000Z',
    updatedAt: '2026-10-08T00:00:00.000Z',
  },
  {
    id: 'cat_desserts',
    name: 'دسر',
    slug: 'desserts',
    type: 'RECIPE',
    status: 'ACTIVE',
    sortOrder: 1,
    createdAt: '2026-10-08T00:00:00.000Z',
    updatedAt: '2026-10-08T00:00:00.000Z',
  },
  {
    id: 'cat_breakfast',
    name: 'صبحانه',
    slug: 'breakfast',
    type: 'RECIPE',
    status: 'ACTIVE',
    sortOrder: 2,
    createdAt: '2026-10-08T00:00:00.000Z',
    updatedAt: '2026-10-08T00:00:00.000Z',
  },
  {
    id: 'cat_pastries',
    name: 'کیک و شیرینی',
    slug: 'pastries',
    type: 'RECIPE',
    status: 'ACTIVE',
    sortOrder: 3,
    createdAt: '2026-10-08T00:00:00.000Z',
    updatedAt: '2026-10-08T00:00:00.000Z',
  },
];

fs.writeFileSync(categoriesJsonPath, JSON.stringify(categories, null, 2), 'utf8');
console.log(`✓ Updated data/seed/categories.json: 4 official recipe categories installed`);

// 3. Update data/seed/recipes.json categories
const recipesJsonPath = path.join(seedDir, 'recipes.json');
const recipes = JSON.parse(fs.readFileSync(recipesJsonPath, 'utf8'));

// Specific tags for dessert, breakfast, and pastries
const dessertSlugs = new Set(['sahlab', 'sladkiy-myod', 'jus-de-bouye', 'amalaki-panaka', 'iskencebi', 'honey-aroma', 'lait-de-poule']);
const breakfastSlugs = new Set(['bsissa', 'sattu-drink', 'kuurma-chai', 'latte-e-miele', 'lait-de-poule', 'hachimitsu-shogayu']);
const pastriesSlugs = new Set(['fengmi-youzi-cha', 'tashkent-tea', 'peshawari-kahwa', 'afghan-kahwah', 'atay-b-naanaa', 'the-a-la-menthe-algerien', 'chai-noomi-basra', 'fengmi-juhua-cha']);

for (const r of recipes) {
  const cats = ['drinks'];
  if (dessertSlugs.has(r.slug)) cats.push('desserts');
  if (breakfastSlugs.has(r.slug)) cats.push('breakfast');
  if (pastriesSlugs.has(r.slug)) cats.push('pastries');

  r.categories = cats;
  r.categoryIds = cats.map((c) => 'cat_' + c);
}

fs.writeFileSync(recipesJsonPath, JSON.stringify(recipes, null, 2), 'utf8');
console.log(`✓ Updated data/seed/recipes.json: 37 recipes categorized across 4 client categories`);

// 4. Update data/seed/homepage-sections.json
const homepageSectionsPath = path.join(seedDir, 'homepage-sections.json');
const sections = JSON.parse(fs.readFileSync(homepageSectionsPath, 'utf8'));

// 7 client photos with photo_35 strictly FIRST
const heroSliderImages = [
  { url: '/images/hero/photo_35.jpg', alt: 'شهد زرین و کندوهای عسل طبیعی باباخُرم' },
  { url: '/images/hero/photo_32.jpg', alt: 'مراتع سرسبز کوهستانی و زنبورداری سنتی' },
  { url: '/images/hero/photo_33.jpg', alt: 'زنبورداران پرتلاش و متعهد باباخُرم' },
  { url: '/images/hero/photo_34.jpg', alt: 'برداشت مستقیم عسل خالص از شان' },
  { url: '/images/hero/photo_36.jpg', alt: 'کلونی‌های فعال زنبور عسل در طبیعت بکر' },
  { url: '/images/hero/photo_37.jpg', alt: 'عسل کوهستان با بالاترین درجه خلوص و اصالت' },
  { url: '/images/hero/photo_38.jpg', alt: 'شهد ناب و طبیعی دامنه کوهستان' },
];

for (const sec of sections) {
  if (sec.id === 'sec_hero_1') {
    sec.content.images = heroSliderImages;
  }
  if (sec.id === 'sec_beekeeping_2') {
    sec.content.image = {
      url: '/images/hero/feature-honey.jpg',
      alt: 'عسل اصیل و طبیعی باباخُرم',
    };
  }
}

fs.writeFileSync(homepageSectionsPath, JSON.stringify(sections, null, 2), 'utf8');
console.log(`✓ Updated data/seed/homepage-sections.json: Hero slider (photo_35 first) & Feature image (photo_39) configured`);

console.log('====================================================');
console.log('✅ Import finished successfully!');
console.log('====================================================');
