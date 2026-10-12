#!/usr/bin/env node

/**
 * Media Cleanup Script (Phase 3, Task 6)
 * Usage:
 *   node scripts/media-cleanup.mjs [--dry-run]
 * Scans MediaAssets older than 7 days.
 * Preserves all assets referenced by Products, Recipes, SiteSettings, or HomepageSection JSON.
 * Deletes unreferenced orphan assets and their disk variants.
 */

import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const seedDir = path.join(rootDir, 'data/seed');
const uploadDir = path.resolve(rootDir, process.env.UPLOAD_DIR || './uploads');

const isDryRun = process.argv.includes('--dry-run');
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function loadJson(filename, defaultValue) {
  const p = path.join(seedDir, filename);
  if (fs.existsSync(p)) {
    try {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch {
      return defaultValue;
    }
  }
  return defaultValue;
}

function scanJsonForAsset(json, targetId, storageKey) {
  if (!json) return false;
  if (typeof json === 'string') {
    if (json === targetId) return true;
    if (storageKey && json.includes(storageKey)) return true;
    return false;
  }
  if (Array.isArray(json)) {
    return json.some((item) => scanJsonForAsset(item, targetId, storageKey));
  }
  if (typeof json === 'object') {
    for (const [key, value] of Object.entries(json)) {
      if (
        (key === 'id' || key === 'assetId' || key === 'mediaId' || key === 'imageId') &&
        value === targetId
      ) {
        return true;
      }
      if (scanJsonForAsset(value, targetId, storageKey)) {
        return true;
      }
    }
  }
  return false;
}

async function main() {
  console.log('----------------------------------------------------');
  console.log(`🧹 اجرای اسکریپت پاکسازی رسانه‌های بی‌استفاده (Media Cleanup) ${isDryRun ? '[حالت آزمایشی: DRY-RUN]' : '[حالت عملیاتی]'}`);
  console.log('----------------------------------------------------');

  const mediaAssets = loadJson('media-assets.json', []);
  const products = loadJson('products.json', []);
  const recipes = loadJson('recipes.json', []);
  const siteSettings = loadJson('site-settings.json', [{}]);
  const homepageSections = loadJson('homepage-sections.json', []);

  const settings = Array.isArray(siteSettings) ? siteSettings[0] : siteSettings;

  const now = Date.now();
  let scannedCount = 0;
  let newGraceCount = 0;
  let referencedCount = 0;
  let deleteCandidates = [];

  for (const asset of mediaAssets) {
    scannedCount++;
    const assetAge = now - new Date(asset.createdAt).getTime();

    // 1. Grace period check (skip if newer than 7 days)
    if (assetAge < SEVEN_DAYS_MS) {
      newGraceCount++;
      continue;
    }

    // 2. Reference tracking
    let isReferenced = false;

    // Check products
    for (const p of products) {
      if (p.mainImageId === asset.id) isReferenced = true;
      if (Array.isArray(p.gallery) && p.gallery.some((g) => g.assetId === asset.id || g.id === asset.id)) isReferenced = true;
      if (isReferenced) break;
    }

    // Check recipes
    if (!isReferenced) {
      for (const r of recipes) {
        if (r.mainImageId === asset.id) isReferenced = true;
        if (Array.isArray(r.gallery) && r.gallery.some((g) => g.assetId === asset.id || g.id === asset.id)) isReferenced = true;
        if (isReferenced) break;
      }
    }

    // Check site settings
    if (!isReferenced && settings) {
      if (settings.logoId === asset.id || settings.footerLogoId === asset.id || settings.ogImageId === asset.id) {
        isReferenced = true;
      }
    }

    // Check homepage sections
    if (!isReferenced) {
      for (const s of homepageSections) {
        if (scanJsonForAsset(s.content, asset.id, asset.storageKey)) {
          isReferenced = true;
          break;
        }
      }
    }

    if (isReferenced) {
      referencedCount++;
    } else {
      deleteCandidates.push(asset);
    }
  }

  console.log(`• تعداد کل فایل‌های بررسی‌شده: ${scannedCount}`);
  console.log(`• فایل‌های تازه‌آپلودشده (کمتر از ۷ روز - امان): ${newGraceCount}`);
  console.log(`• فایل‌های در حال استفاده در سایت (حفظ قطعی): ${referencedCount}`);
  console.log(`• فایل‌های یتیم و بی‌استفاده (> ۷ روز): ${deleteCandidates.length}`);

  if (deleteCandidates.length > 0) {
    console.log('\nفهرست اقلام هدف پاکسازی:');
    for (const item of deleteCandidates) {
      console.log(`  - شناسه: ${item.id} | کلید: ${item.storageKey} | تاریخ: ${new Date(item.createdAt).toLocaleDateString('fa-IR')}`);

      if (!isDryRun) {
        // Delete variant files from uploads directory
        if (item.variants && typeof item.variants === 'object') {
          for (const variant of Object.values(item.variants)) {
            if (variant?.key) {
              const vPath = path.join(uploadDir, variant.key);
              if (fs.existsSync(vPath)) fs.unlinkSync(vPath);
            }
          }
        }
        const masterPath = path.join(uploadDir, item.storageKey);
        if (fs.existsSync(masterPath)) fs.unlinkSync(masterPath);
      }
    }

    if (!isDryRun) {
      const remainingAssets = mediaAssets.filter((a) => !deleteCandidates.some((d) => d.id === a.id));
      fs.writeFileSync(path.join(seedDir, 'media-assets.json'), JSON.stringify(remainingAssets, null, 2), 'utf8');
      console.log(`\n✓ ${deleteCandidates.length} فایل یتیم و دیسک‌های مربوطه با موفقیت حذف شدند.`);
    } else {
      console.log('\n[DRY-RUN] هیچ فایلی حذف نشد.');
    }
  } else {
    console.log('\n✓ هیچ فایل یتیمی برای پاکسازی یافت نشد.');
  }

  console.log('----------------------------------------------------');
}

main().catch((err) => {
  console.error('Error during media cleanup:', err);
  process.exit(1);
});
