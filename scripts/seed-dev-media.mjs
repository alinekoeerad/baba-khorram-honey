#!/usr/bin/env node

/**
 * Dev-Only Media Seeding Script (Phase 3, Task 7)
 * Usage:
 *   pnpm seed:dev-media
 * Refuses to run in production.
 * Pushes sample reference images through the real WebP pipeline and
 * links them as placeholders to seeded products, recipes, and site settings.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { spawnSync } from 'child_process';

if (process.env.NODE_ENV === 'production') {
  console.error('❌ خطا: اجرای اسکریپت seed:dev-media در محیط عملیاتی (production) مجاز نیست.');
  process.exit(1);
}

const rootDir = process.cwd();
const refImagesDir = path.join(rootDir, 'reference/images');
const seedDir = path.join(rootDir, 'data/seed');
const uploadDir = path.resolve(rootDir, process.env.UPLOAD_DIR || './uploads');

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

function saveJson(filename, data) {
  fs.writeFileSync(path.join(seedDir, filename), JSON.stringify(data, null, 2), 'utf8');
}

async function main() {
  console.log('----------------------------------------------------');
  console.log('🌱 آغاز بذرپاشی رسانه‌های توسعه (Dev Media Seeding)');
  console.log('----------------------------------------------------');

  let mediaAssets = loadJson('media-assets.json', []);

  if (!fs.existsSync(refImagesDir)) {
    if (mediaAssets.length > 0) {
      console.log('ℹ️ پوشه reference/images در این مسیر وجود ندارد، اما تصاویر قبلاً با موفقیت بذرپاشی شده‌اند.');
      console.log(`✓ تعداد ${mediaAssets.length} تصویر بهینه‌شده MediaAsset در دسترس است.`);
      console.log('----------------------------------------------------');
      process.exit(0);
    }
    console.error(`❌ پوشه تصاویر مرجع یافت نشد: ${refImagesDir}`);
    console.error('لطفاً پوشه reference را از فایل اولیه پروژه در کنار package.json کپی کنید.');
    process.exit(1);
  }

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const files = fs.readdirSync(refImagesDir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  console.log(`• تعداد تصاویر مرجع شناسایی‌شده: ${files.length}`);

  const products = loadJson('products.json', []);
  const recipes = loadJson('recipes.json', []);
  const siteSettings = loadJson('site-settings.json', [{}]);
  const settings = Array.isArray(siteSettings) ? siteSettings[0] : siteSettings;

  const scriptPath = path.join(rootDir, 'scripts/process-image.py');
  const seededAssets = [];

  for (const filename of files) {
    const inputPath = path.join(refImagesDir, filename);
    const origBytes = fs.statSync(inputPath).size;
    const baseName = path.parse(filename).name;
    const filePrefix = `seed_${baseName}_${crypto.randomBytes(4).toString('hex')}`;

    console.log(`\nپردازش تصویر: ${filename} (${Math.round(origBytes / 1024)} KB)...`);

    const proc = spawnSync('python3', [scriptPath, inputPath, uploadDir, filePrefix], {
      encoding: 'utf8',
    });

    if (proc.status !== 0 || !proc.stdout) {
      console.error(`❌ خطا در پردازش ${filename}:`, proc.stderr);
      continue;
    }

    const result = JSON.parse(proc.stdout.trim());
    if (result.error) {
      console.error(`❌ خطای ابعاد یا فرمت در ${filename}:`, result.error);
      continue;
    }

    const now = new Date();
    const assetRecord = {
      id: `ast_seed_${baseName}`,
      storageKey: result.masterKey,
      mime: 'image/webp',
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      blurDataUrl: result.blurDataUrl,
      variants: result.variants,
      alt: `تصویر نمونه ${baseName}`,
      createdById: 'usr_system',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    // Upsert to mediaAssets list
    const existingIdx = mediaAssets.findIndex((m) => m.id === assetRecord.id);
    if (existingIdx !== -1) {
      mediaAssets[existingIdx] = assetRecord;
    } else {
      mediaAssets.push(assetRecord);
    }

    seededAssets.push({
      filename,
      id: assetRecord.id,
      dimensions: `${result.width}x${result.height}`,
      origKb: Math.round(origBytes / 1024),
      webpKb: Math.round(result.bytes / 1024),
      variantsCount: Object.keys(result.variants).length,
    });
  }

  saveJson('media-assets.json', mediaAssets);

  // Link sample assets to products and recipes
  console.log('\nپیونددهی تصاویر به محصولات و دستورها...');

  const honeyJarAsset = mediaAssets.find((a) => a.id.includes('honey-jar'));
  const beekeepingAsset = mediaAssets.find((a) => a.id.includes('beekeeping'));

  // Link products
  for (let i = 0; i < products.length; i++) {
    if (!products[i].mainImageId && honeyJarAsset) {
      products[i].mainImageId = honeyJarAsset.id;
    }
  }
  saveJson('products.json', products);

  // Link recipes (recipe-1 to recipe-6)
  for (let i = 0; i < recipes.length; i++) {
    const recipeImg = mediaAssets.find((a) => a.id === `ast_seed_recipe-${(i % 6) + 1}`);
    if (recipeImg) {
      recipes[i].mainImageId = recipeImg.id;
    }
  }
  saveJson('recipes.json', recipes);

  // Link site settings
  if (settings && beekeepingAsset) {
    settings.ogImageId = beekeepingAsset.id;
    saveJson('site-settings.json', settings);
  }

  console.log('----------------------------------------------------');
  console.log('✓ بذرپاشی تصاویر با موفقیت تکمیل شد.');
  console.log('خلاصه تصاویر تبدیل‌شده به نگارش‌های WebP:');
  console.table(seededAssets);
  console.log('----------------------------------------------------');
}

main().catch((err) => {
  console.error('Fatal error during dev media seed:', err);
  process.exit(1);
});
