#!/usr/bin/env node

/**
 * Unified Production Seed Script: Mock DB (JSON Files) -> PostgreSQL (Prisma)
 * Path: scripts/seed-db.mjs
 *
 * Idempotently seeds all tables into PostgreSQL:
 * - Users & Accounts (Admin credentials)
 * - Categories (Products & Recipes)
 * - Media Assets & Contact Channels
 * - Site Settings (Singleton row id = 1)
 * - Products, Benefits, Options, Categories & Gallery
 * - Recipes, Ingredients, Steps, Categories & Gallery
 * - Homepage Sections & Section Items
 * - FAQ Items (with rich content blocks)
 * - Magazine Articles (with scientific blocks and 29-honey temperament table)
 * - Feedback & Audit Logs (if seed files exist)
 *
 * Execution:
 *   node scripts/seed-db.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const seedDir = path.join(rootDir, 'data', 'seed');

function loadJson(filename, defaultValue = []) {
  try {
    const filePath = path.join(seedDir, filename);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn(`[WARN] Failed to load ${filename}, using default.`, err.message);
  }
  return defaultValue;
}

function parseDate(val, fallback = new Date()) {
  if (!val) return fallback;
  const d = new Date(val);
  return isNaN(d.getTime()) ? fallback : d;
}

function safeInt(val, fallback = 0) {
  if (val === null || val === undefined || val === '') return fallback;
  const n = Number(val);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

function safeFloat(val, fallback = 0) {
  if (val === null || val === undefined || val === '') return fallback;
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

function safeNullableInt(val) {
  if (val === null || val === undefined || val === '') return null;
  const n = Number(val);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function safeNullableString(val) {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'string') return val;
  if (typeof val === 'boolean') return null;
  return String(val);
}

async function insertInChunks(label, items, chunkSize, inserter) {
  if (!items.length) {
    console.log(`  ℹ️  ${label}: 0 records.`);
    return 0;
  }
  let count = 0;
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    await inserter(chunk);
    count += chunk.length;
  }
  console.log(`  ✅ ${label}: ${count} records processed.`);
  return count;
}

export async function runDatabaseSeed() {
  console.log('========================================================================');
  console.log('🍯 IDEMPOTENT DATABASE SEED: JSON Seed -> PostgreSQL Database');
  console.log('========================================================================\n');

  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://honey_admin:ChangeMeSecurePassword123!@localhost:5432/honey_prod?schema=public';

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('📡 1. Checking database connection...');
    await prisma.$connect();
    console.log('  ✅ Database connection established.\n');

    const stats = {};

    // -------------------------------------------------------------------------
    // 1. Users
    // -------------------------------------------------------------------------
    console.log('📦 2. Seeding Users & Auth Accounts...');
    const usersRaw = loadJson('users.json', []);
    
    // Ensure default admin user if users.json is empty
    if (!usersRaw.some((u) => u.email === 'admin@babakhorram.com' || u.email === 'admin@honey.ir')) {
      usersRaw.unshift({
        id: 'usr_admin_default',
        name: 'مدیر ارشد باباخُرم',
        email: 'admin@babakhorram.com',
        emailVerified: true,
        image: null,
        role: 'ADMIN',
        isActive: true,
        createdAt: '2026-10-08T00:00:00.000Z',
        updatedAt: '2026-10-08T00:00:00.000Z',
      });
    }

    for (const u of usersRaw) {
      await prisma.user.upsert({
        where: { email: u.email },
        create: {
          id: u.id,
          name: u.name ?? null,
          email: u.email,
          emailVerified: Boolean(u.emailVerified),
          image: u.image ?? null,
          role: u.role || 'ADMIN',
          isActive: u.isActive !== undefined ? Boolean(u.isActive) : true,
          lastLoginAt: u.lastLoginAt ? parseDate(u.lastLoginAt) : null,
          createdAt: parseDate(u.createdAt),
          updatedAt: parseDate(u.updatedAt),
        },
        update: {
          name: u.name ?? null,
          role: u.role || 'ADMIN',
          isActive: u.isActive !== undefined ? Boolean(u.isActive) : true,
        },
      });
    }
    stats['Users'] = usersRaw.length;
    console.log(`  ✅ Users: ${usersRaw.length} records upserted.`);

    const existingUsers = await prisma.user.findMany({ select: { id: true, email: true } });
    const userMapByEmail = new Map(existingUsers.map((u) => [u.email, u.id]));
    const validUserIds = new Set(existingUsers.map((u) => u.id));

    // -------------------------------------------------------------------------
    // 2. Accounts (Credentials for Better Auth)
    // -------------------------------------------------------------------------
    const accountsRaw = loadJson('accounts.json', []);
    // Default admin account password hash ($scrypt for Admin123456!)
    const defaultPasswordHash =
      '$scrypt$fe6794323c3b70616654a7267e193b15$5f250b344f81cb371f35bdfbcdcf450a2cfac4fa3a61be38f6122b9750c4680c';

    // Ensure account exists for all admins
    for (const [email, userId] of userMapByEmail.entries()) {
      if (!accountsRaw.some((a) => a.userId === userId)) {
        accountsRaw.push({
          id: `acc_${userId}`,
          userId,
          accountId: userId,
          providerId: 'credential',
          password: defaultPasswordHash,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    for (const a of accountsRaw) {
      if (validUserIds.has(a.userId)) {
        const accountId = a.id || `acc_${a.userId}`;
        await prisma.account.upsert({
          where: { id: accountId },
          create: {
            id: accountId,
            userId: a.userId,
            accountId: a.accountId || a.userId,
            providerId: a.providerId || 'credential',
            password: a.password || defaultPasswordHash,
            createdAt: parseDate(a.createdAt),
            updatedAt: parseDate(a.updatedAt),
          },
          update: {
            password: a.password || defaultPasswordHash,
          },
        });
      }
    }
    stats['Accounts'] = accountsRaw.length;
    console.log(`  ✅ Accounts: ${accountsRaw.length} records upserted.`);

    // -------------------------------------------------------------------------
    // 3. Categories
    // -------------------------------------------------------------------------
    console.log('🏷️ 3. Seeding Categories...');
    const categoriesRaw = loadJson('categories.json', []);
    for (const c of categoriesRaw) {
      const categoryId = c.id || `cat_${c.slug}`;
      await prisma.category.upsert({
        where: { id: categoryId },
        create: {
          id: categoryId,
          name: c.name,
          slug: c.slug,
          type: c.type || 'PRODUCT',
          status: c.status || 'ACTIVE',
          sortOrder: safeInt(c.sortOrder, 0),
          createdAt: parseDate(c.createdAt),
          updatedAt: parseDate(c.updatedAt),
        },
        update: {
          name: c.name,
          slug: c.slug,
          type: c.type || 'PRODUCT',
          status: c.status || 'ACTIVE',
          sortOrder: safeInt(c.sortOrder, 0),
        },
      });
    }
    stats['Categories'] = categoriesRaw.length;
    console.log(`  ✅ Categories: ${categoriesRaw.length} records upserted.`);
    const allCategories = await prisma.category.findMany({ select: { id: true, slug: true, type: true } });
    const validCategoryIds = new Set(allCategories.map((c) => c.id));

    // -------------------------------------------------------------------------
    // 4. Media Assets
    // -------------------------------------------------------------------------
    console.log('🖼️ 4. Seeding Media Assets...');
    const mediaRaw = loadJson('media-assets.json', []);
    const mediaData = mediaRaw.map((m) => ({
      id: m.id,
      storageKey: m.storageKey,
      mime: m.mime || 'image/webp',
      bytes: safeInt(m.bytes, 0),
      width: safeNullableInt(m.width),
      height: safeNullableInt(m.height),
      blurDataUrl: m.blurDataUrl ?? null,
      variants: m.variants ? (typeof m.variants === 'string' ? JSON.parse(m.variants) : m.variants) : undefined,
      alt: m.alt ?? null,
      createdById: m.createdById && validUserIds.has(m.createdById) ? m.createdById : null,
      createdAt: parseDate(m.createdAt),
      updatedAt: parseDate(m.updatedAt),
    }));
    stats['MediaAssets'] = await insertInChunks('MediaAssets', mediaData, 100, (chunk) =>
      prisma.mediaAsset.createMany({ data: chunk, skipDuplicates: true })
    );
    const allMedia = await prisma.mediaAsset.findMany({ select: { id: true } });
    const validAssetIds = new Set(allMedia.map((m) => m.id));

    // -------------------------------------------------------------------------
    // 5. Contact Channels
    // -------------------------------------------------------------------------
    console.log('📞 5. Seeding Contact Channels...');
    const channelsRaw = loadJson('contact-channels.json', []);
    for (const ch of channelsRaw) {
      await prisma.contactChannel.upsert({
        where: { id: ch.id },
        create: {
          id: ch.id,
          type: ch.type || 'PHONE',
          value: ch.value,
          label: ch.label ?? null,
          isActive: ch.isActive !== undefined ? Boolean(ch.isActive) : true,
          sortOrder: safeInt(ch.sortOrder, 0),
          showInContactBar: ch.showInContactBar !== undefined ? Boolean(ch.showInContactBar) : true,
          showInFooter: ch.showInFooter !== undefined ? Boolean(ch.showInFooter) : true,
          showInContactPage: ch.showInContactPage !== undefined ? Boolean(ch.showInContactPage) : true,
          acceptsOrders: ch.acceptsOrders !== undefined ? Boolean(ch.acceptsOrders) : false,
          createdAt: parseDate(ch.createdAt),
          updatedAt: parseDate(ch.updatedAt),
        },
        update: {
          value: ch.value,
          label: ch.label ?? null,
          isActive: ch.isActive !== undefined ? Boolean(ch.isActive) : true,
          sortOrder: safeInt(ch.sortOrder, 0),
        },
      });
    }
    stats['ContactChannels'] = channelsRaw.length;
    console.log(`  ✅ ContactChannels: ${channelsRaw.length} records upserted.`);

    // -------------------------------------------------------------------------
    // 6. Site Settings (Singleton id = 1)
    // -------------------------------------------------------------------------
    console.log('⚙️ 6. Seeding Site Settings...');
    const settingsRaw = loadJson('site-settings.json', { id: 1, siteNameFa: 'عسل باباخُرم' });
    const settingsLogoId = settingsRaw.logoId && validAssetIds.has(settingsRaw.logoId) ? settingsRaw.logoId : null;
    const settingsFooterLogoId =
      settingsRaw.footerLogoId && validAssetIds.has(settingsRaw.footerLogoId) ? settingsRaw.footerLogoId : null;
    const settingsOgImageId =
      settingsRaw.ogImageId && validAssetIds.has(settingsRaw.ogImageId) ? settingsRaw.ogImageId : null;

    await prisma.siteSettings.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        siteNameFa: settingsRaw.siteNameFa || 'عسل باباخُرم',
        siteNameEn: settingsRaw.siteNameEn ?? null,
        tagline: settingsRaw.tagline ?? null,
        logoId: settingsLogoId,
        footerLogoId: settingsFooterLogoId,
        ogImageId: settingsOgImageId,
        address: settingsRaw.address ?? 'کرج، جهانشهر، بلوار مولانا',
        workingHours: settingsRaw.workingHours ?? 'همه‌روزه از ساعت ۹:۰۰ الی ۲۱:۰۰',
        latitude: safeFloat(settingsRaw.latitude, 35.8339878),
        longitude: safeFloat(settingsRaw.longitude, 50.9915841),
        mapZoom: safeInt(settingsRaw.mapZoom, 15),
        copyrightText: settingsRaw.copyrightText ?? 'تمامی حقوق برای برند عسل باباخُرم محفوظ است. طراحی و توسعه ۱۴۰۵.',
        seoTitle: settingsRaw.seoTitle ?? 'عسل باباخُرم | طعم اصیل و طبیعی کوهستان',
        seoDescription: settingsRaw.seoDescription ?? 'تولید و عرضه مستقیم انواع عسل طبیعی و ارگانیک از دامنه‌های ارسباران و قره‌داغ.',
        cartEnabled: Boolean(settingsRaw.cartEnabled),
        cartNotice: settingsRaw.cartNotice || 'قیمت و هزینه‌ی ارسال پس از تأیید اعلام می‌شود.',
        orderIntroText: settingsRaw.orderIntroText ?? null,
        orderOutroText: settingsRaw.orderOutroText ?? null,
        isPlaceholder: Boolean(settingsRaw.isPlaceholder),
        updatedAt: parseDate(settingsRaw.updatedAt),
      },
      update: {
        siteNameFa: settingsRaw.siteNameFa || 'عسل باباخُرم',
        siteNameEn: settingsRaw.siteNameEn ?? null,
        tagline: settingsRaw.tagline ?? null,
        logoId: settingsLogoId,
        footerLogoId: settingsFooterLogoId,
        ogImageId: settingsOgImageId,
        address: settingsRaw.address ?? 'کرج، جهانشهر، بلوار مولانا',
        workingHours: settingsRaw.workingHours ?? 'همه‌روزه از ساعت ۹:۰۰ الی ۲۱:۰۰',
        cartEnabled: Boolean(settingsRaw.cartEnabled),
        cartNotice: settingsRaw.cartNotice || 'قیمت و هزینه‌ی ارسال پس از تأیید اعلام می‌شود.',
        isPlaceholder: Boolean(settingsRaw.isPlaceholder),
        updatedAt: parseDate(settingsRaw.updatedAt),
      },
    });
    stats['SiteSettings'] = 1;
    console.log('  ✅ SiteSettings: 1 record upserted.');

    // -------------------------------------------------------------------------
    // 7. Homepage Sections
    // -------------------------------------------------------------------------
    console.log('📑 7. Seeding Homepage Sections...');
    const sectionsRaw = loadJson('homepage-sections.json', []);
    for (const s of sectionsRaw) {
      await prisma.homepageSection.upsert({
        where: { id: s.id },
        create: {
          id: s.id,
          type: s.type || 'HERO',
          template: s.template || 'default',
          status: s.status || 'DRAFT',
          sortOrder: safeInt(s.sortOrder, 0),
          background: s.background || 'NONE',
          internalName: s.internalName || 'Section',
          content: s.content ?? {},
          createdAt: parseDate(s.createdAt),
          updatedAt: parseDate(s.updatedAt),
        },
        update: {
          template: s.template || 'default',
          status: s.status || 'DRAFT',
          sortOrder: safeInt(s.sortOrder, 0),
          background: s.background || 'NONE',
          internalName: s.internalName || 'Section',
          content: s.content ?? {},
        },
      });
    }
    stats['HomepageSections'] = sectionsRaw.length;
    console.log(`  ✅ HomepageSections: ${sectionsRaw.length} records upserted.`);
    const validSectionIds = new Set(sectionsRaw.map((s) => s.id));

    // -------------------------------------------------------------------------
    // 8. Products, Benefits, Options, Categories & Gallery
    // -------------------------------------------------------------------------
    console.log('🍯 8. Seeding Products & Related Items...');
    const productsRaw = loadJson('products.json', []);
    const productOptionsRaw = loadJson('product-options.json', []);
    const productGalleryRaw = loadJson('product-gallery.json', []);

    for (const p of productsRaw) {
      const mainImageId = p.mainImageId && validAssetIds.has(p.mainImageId) ? p.mainImageId : null;
      await prisma.product.upsert({
        where: { slug: p.slug },
        create: {
          id: p.id,
          slug: p.slug,
          nameFa: p.nameFa,
          nameOriginal: p.nameOriginal ?? null,
          status: p.status || 'DRAFT',
          isAvailable: p.isAvailable !== undefined ? Boolean(p.isAvailable) : true,
          isFeatured: p.isFeatured !== undefined ? Boolean(p.isFeatured) : false,
          cardTheme: p.cardTheme || 'AUTO',
          sortOrder: safeInt(p.sortOrder, 0),
          shortDescription: p.shortDescription ?? null,
          description: p.description ?? null,
          foodNature: p.foodNature ?? null,
          vitamins: p.vitamins ?? null,
          harvestSeason: p.harvestSeason ?? null,
          harvestPlace: p.harvestPlace ?? null,
          color: p.color ?? null,
          usageWarning: p.usageWarning ?? null,
          mainImageId,
          focalPoint: p.focalPoint || 'center',
          searchText: p.searchText || '',
          createdAt: parseDate(p.createdAt),
          updatedAt: parseDate(p.updatedAt),
        },
        update: {
          nameFa: p.nameFa,
          nameOriginal: p.nameOriginal ?? null,
          status: p.status || 'DRAFT',
          isAvailable: p.isAvailable !== undefined ? Boolean(p.isAvailable) : true,
          isFeatured: p.isFeatured !== undefined ? Boolean(p.isFeatured) : false,
          cardTheme: p.cardTheme || 'AUTO',
          sortOrder: safeInt(p.sortOrder, 0),
          shortDescription: p.shortDescription ?? null,
          description: p.description ?? null,
          foodNature: p.foodNature ?? null,
          vitamins: p.vitamins ?? null,
          harvestSeason: p.harvestSeason ?? null,
          harvestPlace: p.harvestPlace ?? null,
          color: p.color ?? null,
          usageWarning: p.usageWarning ?? null,
          mainImageId,
          focalPoint: p.focalPoint || 'center',
          searchText: p.searchText || '',
        },
      });
    }
    stats['Products'] = productsRaw.length;
    console.log(`  ✅ Products: ${productsRaw.length} records upserted.`);

    const existingProducts = await prisma.product.findMany({ select: { id: true, slug: true } });
    const validProductIds = new Set(existingProducts.map((p) => p.id));

    // Product Benefits
    const benefitsData = [];
    for (const p of productsRaw) {
      if (Array.isArray(p.benefits) && validProductIds.has(p.id)) {
        p.benefits.forEach((bText, idx) => {
          benefitsData.push({
            id: `pbn_${p.id}_${idx}`,
            productId: p.id,
            text: String(bText),
            sortOrder: idx,
          });
        });
      }
    }
    stats['ProductBenefits'] = await insertInChunks('ProductBenefits', benefitsData, 100, (chunk) =>
      prisma.productBenefit.createMany({ data: chunk, skipDuplicates: true })
    );

    // Product Options
    const optionsMap = new Map();
    for (const p of productsRaw) {
      if (Array.isArray(p.options) && validProductIds.has(p.id)) {
        for (const opt of p.options) {
          if (opt.id) {
            optionsMap.set(opt.id, {
              id: opt.id,
              productId: p.id,
              label: opt.label || 'وزن پیش‌فرض',
              isAvailable: opt.isAvailable !== undefined ? Boolean(opt.isAvailable) : true,
              sortOrder: safeInt(opt.sortOrder, 0),
              createdAt: parseDate(opt.createdAt || p.createdAt),
              updatedAt: parseDate(opt.updatedAt || p.updatedAt),
            });
          }
        }
      }
    }
    for (const opt of productOptionsRaw) {
      if (validProductIds.has(opt.productId) && !optionsMap.has(opt.id)) {
        optionsMap.set(opt.id, {
          id: opt.id,
          productId: opt.productId,
          label: opt.label || 'وزن',
          isAvailable: opt.isAvailable !== undefined ? Boolean(opt.isAvailable) : true,
          sortOrder: safeInt(opt.sortOrder, 0),
          createdAt: parseDate(opt.createdAt),
          updatedAt: parseDate(opt.updatedAt),
        });
      }
    }
    stats['ProductOptions'] = await insertInChunks('ProductOptions', Array.from(optionsMap.values()), 100, (chunk) =>
      prisma.productOption.createMany({ data: chunk, skipDuplicates: true })
    );

    // Product Categories (Junction)
    const productCategoryMap = new Map();
    for (const p of productsRaw) {
      if (validProductIds.has(p.id)) {
        const catIds = Array.isArray(p.categoryIds) ? p.categoryIds : [];
        if (p.categorySlug) {
          const matched = allCategories.find((c) => c.slug === p.categorySlug && c.type === 'PRODUCT');
          if (matched && !catIds.includes(matched.id)) catIds.push(matched.id);
        }
        for (const cId of catIds) {
          if (validCategoryIds.has(cId)) {
            productCategoryMap.set(`${p.id}_${cId}`, { productId: p.id, categoryId: cId });
          }
        }
      }
    }
    stats['ProductCategories'] = await insertInChunks(
      'ProductCategories',
      Array.from(productCategoryMap.values()),
      100,
      (chunk) => prisma.productCategory.createMany({ data: chunk, skipDuplicates: true })
    );

    // Product Gallery
    const productGalleryMap = new Map();
    for (const gi of productGalleryRaw) {
      if (validProductIds.has(gi.productId) && validAssetIds.has(gi.assetId)) {
        const key = `${gi.productId}_${gi.assetId}`;
        if (!productGalleryMap.has(key)) {
          productGalleryMap.set(key, {
            id: gi.id || `pgi_${gi.productId}_${gi.assetId}`,
            productId: gi.productId,
            assetId: gi.assetId,
            sortOrder: safeInt(gi.sortOrder, 0),
          });
        }
      }
    }
    stats['ProductGallery'] = await insertInChunks(
      'ProductGallery',
      Array.from(productGalleryMap.values()),
      100,
      (chunk) => prisma.productGalleryItem.createMany({ data: chunk, skipDuplicates: true })
    );

    // -------------------------------------------------------------------------
    // 9. Recipes, Ingredients, Steps, Categories & Gallery
    // -------------------------------------------------------------------------
    console.log('🍲 9. Seeding Recipes & Related Items...');
    const recipesRaw = loadJson('recipes.json', []);
    const recipeGalleryRaw = loadJson('recipe-gallery.json', []);

    for (const r of recipesRaw) {
      const mainImageId = r.mainImageId && validAssetIds.has(r.mainImageId) ? r.mainImageId : null;
      await prisma.recipe.upsert({
        where: { slug: r.slug },
        create: {
          id: r.id,
          slug: r.slug,
          nameFa: r.nameFa,
          nameOriginal: r.nameOriginal ?? null,
          country: r.country ?? null,
          servingTypes: r.servingTypes || [],
          yieldText: r.yieldText ?? null,
          shortDescription: r.shortDescription ?? null,
          longDescription: r.longDescription ?? null,
          status: r.status || 'DRAFT',
          isFeatured: r.isFeatured !== undefined ? Boolean(r.isFeatured) : false,
          cardTheme: r.cardTheme || 'YELLOW',
          sortOrder: safeInt(r.sortOrder, 0),
          mainImageId,
          focalPoint: r.focalPoint || 'center',
          searchText: r.searchText || '',
          createdAt: parseDate(r.createdAt),
          updatedAt: parseDate(r.updatedAt),
        },
        update: {
          nameFa: r.nameFa,
          nameOriginal: r.nameOriginal ?? null,
          country: r.country ?? null,
          servingTypes: r.servingTypes || [],
          yieldText: r.yieldText ?? null,
          shortDescription: r.shortDescription ?? null,
          longDescription: r.longDescription ?? null,
          status: r.status || 'DRAFT',
          isFeatured: r.isFeatured !== undefined ? Boolean(r.isFeatured) : false,
          cardTheme: r.cardTheme || 'YELLOW',
          sortOrder: safeInt(r.sortOrder, 0),
          mainImageId,
          focalPoint: r.focalPoint || 'center',
          searchText: r.searchText || '',
        },
      });
    }
    stats['Recipes'] = recipesRaw.length;
    console.log(`  ✅ Recipes: ${recipesRaw.length} records upserted.`);

    const existingRecipes = await prisma.recipe.findMany({ select: { id: true, slug: true } });
    const validRecipeIds = new Set(existingRecipes.map((r) => r.id));

    // Ingredients
    const ingredientsData = [];
    for (const r of recipesRaw) {
      if (Array.isArray(r.ingredients) && validRecipeIds.has(r.id)) {
        r.ingredients.forEach((ing, idx) => {
          ingredientsData.push({
            id: ing.id || `ring_${r.id}_${idx}`,
            recipeId: r.id,
            name: String(ing.name || 'ماده اولیه'),
            quantityText: safeNullableString(ing.quantityText),
            unit: safeNullableString(ing.unit),
            equivalentText: safeNullableString(ing.equivalentText),
            isOptional: Boolean(ing.isOptional),
            note: safeNullableString(ing.note),
            sortOrder: safeInt(ing.sortOrder, idx),
          });
        });
      }
    }
    stats['RecipeIngredients'] = await insertInChunks('RecipeIngredients', ingredientsData, 100, (chunk) =>
      prisma.recipeIngredient.createMany({ data: chunk, skipDuplicates: true })
    );

    // Steps
    const stepsData = [];
    for (const r of recipesRaw) {
      if (Array.isArray(r.steps) && validRecipeIds.has(r.id)) {
        r.steps.forEach((st, idx) => {
          stepsData.push({
            id: st.id || `rstp_${r.id}_${idx}`,
            recipeId: r.id,
            text: st.text || '',
            sortOrder: safeInt(st.sortOrder, idx),
          });
        });
      }
    }
    stats['RecipeSteps'] = await insertInChunks('RecipeSteps', stepsData, 100, (chunk) =>
      prisma.recipeStep.createMany({ data: chunk, skipDuplicates: true })
    );

    // Recipe Categories
    const recipeCategoryMap = new Map();
    for (const r of recipesRaw) {
      if (validRecipeIds.has(r.id)) {
        const catIds = Array.isArray(r.categoryIds) ? r.categoryIds : [];
        if (Array.isArray(r.categories)) {
          for (const slugOrName of r.categories) {
            const matched = allCategories.find((c) => (c.slug === slugOrName || c.name === slugOrName) && c.type === 'RECIPE');
            if (matched && !catIds.includes(matched.id)) catIds.push(matched.id);
          }
        }
        for (const cId of catIds) {
          if (validCategoryIds.has(cId)) {
            recipeCategoryMap.set(`${r.id}_${cId}`, { recipeId: r.id, categoryId: cId });
          }
        }
      }
    }
    stats['RecipeCategories'] = await insertInChunks(
      'RecipeCategories',
      Array.from(recipeCategoryMap.values()),
      100,
      (chunk) => prisma.recipeCategory.createMany({ data: chunk, skipDuplicates: true })
    );

    // Recipe Gallery
    const recipeGalleryMap = new Map();
    for (const gi of recipeGalleryRaw) {
      if (validRecipeIds.has(gi.recipeId) && validAssetIds.has(gi.assetId)) {
        const key = `${gi.recipeId}_${gi.assetId}`;
        if (!recipeGalleryMap.has(key)) {
          recipeGalleryMap.set(key, {
            id: gi.id || `rgi_${gi.recipeId}_${gi.assetId}`,
            recipeId: gi.recipeId,
            assetId: gi.assetId,
            sortOrder: safeInt(gi.sortOrder, 0),
          });
        }
      }
    }
    stats['RecipeGallery'] = await insertInChunks(
      'RecipeGallery',
      Array.from(recipeGalleryMap.values()),
      100,
      (chunk) => prisma.recipeGalleryItem.createMany({ data: chunk, skipDuplicates: true })
    );

    // -------------------------------------------------------------------------
    // 10. Section Items
    // -------------------------------------------------------------------------
    const sectionItemsData = [];
    for (const sec of sectionsRaw) {
      if (Array.isArray(sec.items) && validSectionIds.has(sec.id)) {
        sec.items.forEach((item, idx) => {
          const productId = item.productId && validProductIds.has(item.productId) ? item.productId : null;
          const recipeId = item.recipeId && validRecipeIds.has(item.recipeId) ? item.recipeId : null;
          sectionItemsData.push({
            id: item.id || `sitem_${sec.id}_${idx}`,
            sectionId: sec.id,
            productId,
            recipeId,
            sortOrder: safeInt(item.sortOrder, idx),
          });
        });
      }
    }
    stats['SectionItems'] = await insertInChunks('SectionItems', sectionItemsData, 100, (chunk) =>
      prisma.sectionItem.createMany({ data: chunk, skipDuplicates: true })
    );

    // -------------------------------------------------------------------------
    // 11. FAQ Items (Idempotent upsert by anchorId)
    // -------------------------------------------------------------------------
    console.log('❓ 11. Seeding FAQ Items...');
    const faqRaw = loadJson('faq-items.json', []);
    for (let idx = 0; idx < faqRaw.length; idx++) {
      const f = faqRaw[idx];
      await prisma.faqItem.upsert({
        where: { anchorId: f.anchorId || f.id },
        create: {
          id: f.id,
          anchorId: f.anchorId || f.id,
          question: f.question,
          answer: f.answer || f.shortAnswer || '',
          category: f.category,
          categoryLabel: f.categoryLabel ?? null,
          sortOrder: safeInt(f.sortOrder, idx),
          isPublished: f.isPublished !== undefined ? Boolean(f.isPublished) : true,
          featuredInNav: Boolean(f.featuredInNav),
          featuredOnHome: Boolean(f.featuredOnHome),
          relatedArticleSlug: f.relatedArticleSlug ?? null,
          relatedArticleLabel: f.relatedArticleLabel ?? null,
          extraData: f.extraData ?? (f.blocks ? { blocks: f.blocks } : null),
        },
        update: {
          question: f.question,
          answer: f.answer || f.shortAnswer || '',
          category: f.category,
          categoryLabel: f.categoryLabel ?? null,
          sortOrder: safeInt(f.sortOrder, idx),
          isPublished: f.isPublished !== undefined ? Boolean(f.isPublished) : true,
          featuredInNav: Boolean(f.featuredInNav),
          featuredOnHome: Boolean(f.featuredOnHome),
          relatedArticleSlug: f.relatedArticleSlug ?? null,
          relatedArticleLabel: f.relatedArticleLabel ?? null,
          extraData: f.extraData ?? (f.blocks ? { blocks: f.blocks } : null),
        },
      });
    }
    stats['FaqItems'] = faqRaw.length;
    console.log(`  ✅ FaqItems: ${faqRaw.length} records upserted.`);

    // -------------------------------------------------------------------------
    // 12. Magazine Articles (Idempotent upsert by slug)
    // -------------------------------------------------------------------------
    console.log('📚 12. Seeding Magazine Articles...');
    const magazineRaw = loadJson('magazine-articles.json', []);
    for (let idx = 0; idx < magazineRaw.length; idx++) {
      const m = magazineRaw[idx];
      await prisma.magazineArticle.upsert({
        where: { slug: m.slug },
        create: {
          id: m.id,
          slug: m.slug,
          title: m.title,
          shortTitle: m.shortTitle ?? null,
          subtitle: m.subtitle ?? null,
          excerpt: m.excerpt,
          coverImage: m.coverImage || m.imageUrl || null,
          category: m.category,
          categoryLabel: m.categoryLabel ?? null,
          badge: m.badge ?? null,
          theme: m.theme || 'YELLOW',
          readTime: m.readTime || `${safeInt(m.readTimeMinutes, 5)} دقیقه مطالعه`,
          readTimeMinutes: safeInt(m.readTimeMinutes, 5),
          status: m.status || 'PUBLISHED',
          sortOrder: safeInt(m.sortOrder, idx),
          featuredInNav: Boolean(m.featuredInNav),
          navOrder: safeInt(m.navOrder, 0),
          sections: m.sections ?? null,
          seoTitle: m.seoTitle ?? null,
          seoDescription: m.seoDescription ?? null,
          publishedAt: m.publishedAt ? parseDate(m.publishedAt) : new Date(),
        },
        update: {
          title: m.title,
          shortTitle: m.shortTitle ?? null,
          subtitle: m.subtitle ?? null,
          excerpt: m.excerpt,
          coverImage: m.coverImage || m.imageUrl || null,
          category: m.category,
          categoryLabel: m.categoryLabel ?? null,
          badge: m.badge ?? null,
          theme: m.theme || 'YELLOW',
          readTime: m.readTime || `${safeInt(m.readTimeMinutes, 5)} دقیقه مطالعه`,
          readTimeMinutes: safeInt(m.readTimeMinutes, 5),
          status: m.status || 'PUBLISHED',
          sortOrder: safeInt(m.sortOrder, idx),
          featuredInNav: Boolean(m.featuredInNav),
          navOrder: safeInt(m.navOrder, 0),
          sections: m.sections ?? null,
          seoTitle: m.seoTitle ?? null,
          seoDescription: m.seoDescription ?? null,
        },
      });
    }
    stats['MagazineArticles'] = magazineRaw.length;
    console.log(`  ✅ MagazineArticles: ${magazineRaw.length} records upserted.`);

    // -------------------------------------------------------------------------
    // 13. Feedbacks (Optional if exists)
    // -------------------------------------------------------------------------
    const feedbacksRaw = loadJson('feedbacks.json', []);
    if (feedbacksRaw.length > 0) {
      const feedbacksData = feedbacksRaw.map((fb) => ({
        id: fb.id,
        trackingCode: fb.trackingCode,
        name: fb.name,
        phone: fb.phone,
        type: fb.type || 'SUGGESTION',
        message: fb.message,
        status: fb.status || 'UNREAD',
        adminNote: fb.adminNote ?? null,
        publicReply: fb.publicReply ?? null,
        ip: fb.ip ?? null,
        createdAt: parseDate(fb.createdAt),
        updatedAt: parseDate(fb.updatedAt),
      }));
      stats['Feedbacks'] = await insertInChunks('Feedbacks', feedbacksData, 100, (chunk) =>
        prisma.feedback.createMany({ data: chunk, skipDuplicates: true })
      );
    }

    console.log('\n========================================================================');
    console.log('🎉 DATABASE SEED COMPLETED SUCCESSFULLY! SUMMARY:');
    console.log('========================================================================');
    console.table(stats);
    console.log('\n✨ All data (Admin, Products, Recipes, Categories, Sections, FAQs, Magazine) is fully synced.');
  } catch (error) {
    console.error('\n❌ [SEED ERROR]', error);
    process.exit(1);
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

// Auto-run when executed directly via CLI
if (process.argv[1] && process.argv[1].endsWith('seed-db.mjs')) {
  runDatabaseSeed();
}
