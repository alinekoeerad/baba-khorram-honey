/**
 * Database Migration Script: Mock DB (JSON Files) -> PostgreSQL (Prisma)
 * Path: scripts/migrate-mock-to-pg.ts
 *
 * Migrates all records from `data/seed/*.json` into PostgreSQL in strict relational order
 * using Prisma Client, handling date parsing, duplicate suppression, and foreign key integrity.
 *
 * Execution:
 *   npx tsx scripts/migrate-mock-to-pg.ts
 *   or: pnpm db:migrate:mock
 */

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const seedDir = path.join(process.cwd(), 'data', 'seed');

function loadJson<T>(filename: string, defaultValue: T): T {
  try {
    const filePath = path.join(seedDir, filename);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn(`[WARN] Failed to load ${filename}, using default.`, err);
  }
  return defaultValue;
}

function parseDate(val: any, fallback = new Date()): Date {
  if (!val) return fallback;
  const d = new Date(val);
  return isNaN(d.getTime()) ? fallback : d;
}

async function insertInChunks<T>(
  label: string,
  items: T[],
  chunkSize: number,
  inserter: (chunk: T[]) => Promise<any>
): Promise<number> {
  if (!items.length) {
    console.log(`  ℹ️  ${label}: 0 records to insert.`);
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

async function main() {
  console.log('========================================================================');
  console.log('🚀 MIGRATION: Mock DB (JSON Files) -> PostgreSQL Database');
  console.log('========================================================================\n');

  if (!fs.existsSync(seedDir)) {
    throw new Error(`Seed directory not found at ${seedDir}!`);
  }

  // Instantiate real PrismaClient
  const prisma = new PrismaClient();

  try {
    // 1. Verify Database Connection
    console.log('📡 1. Verifying PostgreSQL connection...');
    await prisma.$connect();
    console.log('  ✅ Connected successfully to PostgreSQL.\n');

    const stats: Record<string, number> = {};

    // -------------------------------------------------------------------------
    // STEP 1: Independent Tables (No Foreign Keys)
    // -------------------------------------------------------------------------
    console.log('📦 2. Migrating Independent Models (Users, Categories, Media, Channels)...');

    // 1.1 Users
    const usersRaw = loadJson<any[]>('users.json', []);
    const usersData = usersRaw.map((u) => ({
      id: u.id,
      name: u.name ?? null,
      email: u.email,
      emailVerified: Boolean(u.emailVerified),
      image: u.image ?? null,
      role: (u.role || 'ADMIN') as any,
      isActive: u.isActive !== undefined ? Boolean(u.isActive) : true,
      lastLoginAt: u.lastLoginAt ? parseDate(u.lastLoginAt) : null,
      createdAt: parseDate(u.createdAt),
      updatedAt: parseDate(u.updatedAt),
    }));
    stats['Users'] = await insertInChunks('Users', usersData, 100, (chunk) =>
      prisma.user.createMany({ data: chunk, skipDuplicates: true })
    );
    const validUserIds = new Set(usersData.map((u) => u.id));

    // 1.2 Categories
    const categoriesRaw = loadJson<any[]>('categories.json', []);
    const categoriesData = categoriesRaw.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      type: (c.type || 'PRODUCT') as any,
      status: (c.status || 'ACTIVE') as any,
      sortOrder: Number(c.sortOrder) || 0,
      createdAt: parseDate(c.createdAt),
      updatedAt: parseDate(c.updatedAt),
    }));
    stats['Categories'] = await insertInChunks('Categories', categoriesData, 100, (chunk) =>
      prisma.category.createMany({ data: chunk, skipDuplicates: true })
    );
    const validCategoryIds = new Set(categoriesData.map((c) => c.id));

    // 1.3 Media Assets
    const mediaRaw = loadJson<any[]>('media-assets.json', []);
    const mediaData = mediaRaw.map((m) => ({
      id: m.id,
      storageKey: m.storageKey,
      mime: m.mime || 'image/webp',
      bytes: Number(m.bytes) || 0,
      width: m.width !== undefined && m.width !== null ? Number(m.width) : null,
      height: m.height !== undefined && m.height !== null ? Number(m.height) : null,
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
    const validAssetIds = new Set(mediaData.map((m) => m.id));

    // 1.4 Contact Channels
    const channelsRaw = loadJson<any[]>('contact-channels.json', []);
    const channelsData = channelsRaw.map((ch) => ({
      id: ch.id,
      type: (ch.type || 'PHONE') as any,
      value: ch.value,
      label: ch.label ?? null,
      isActive: ch.isActive !== undefined ? Boolean(ch.isActive) : true,
      sortOrder: Number(ch.sortOrder) || 0,
      showInContactBar: ch.showInContactBar !== undefined ? Boolean(ch.showInContactBar) : true,
      showInFooter: ch.showInFooter !== undefined ? Boolean(ch.showInFooter) : true,
      showInContactPage: ch.showInContactPage !== undefined ? Boolean(ch.showInContactPage) : true,
      acceptsOrders: ch.acceptsOrders !== undefined ? Boolean(ch.acceptsOrders) : false,
      createdAt: parseDate(ch.createdAt),
      updatedAt: parseDate(ch.updatedAt),
    }));
    stats['ContactChannels'] = await insertInChunks('ContactChannels', channelsData, 100, (chunk) =>
      prisma.contactChannel.createMany({ data: chunk, skipDuplicates: true })
    );

    // 1.5 Order Share Links
    const oslRaw = loadJson<any[]>('order-share-links.json', []);
    const oslSeenCodes = new Set<string>();
    const oslData: any[] = [];
    for (const osl of oslRaw) {
      if (osl.code && !oslSeenCodes.has(osl.code)) {
        oslSeenCodes.add(osl.code);
        oslData.push({
          id: osl.id,
          code: osl.code,
          payloadEncrypted: osl.payloadEncrypted,
          channelType: (osl.channelType || 'WHATSAPP') as any,
          expiresAt: parseDate(osl.expiresAt),
          createdAt: parseDate(osl.createdAt),
        });
      }
    }
    stats['OrderShareLinks'] = await insertInChunks('OrderShareLinks', oslData, 100, (chunk) =>
      prisma.orderShareLink.createMany({ data: chunk, skipDuplicates: true })
    );

    // 1.6 Orders (Persisted Orders)
    const ordersRaw = loadJson<any[]>('orders.json', []);
    const orderSeenCodes = new Set<string>();
    const ordersData: any[] = [];
    for (const ord of ordersRaw) {
      if (ord.code && !orderSeenCodes.has(ord.code)) {
        orderSeenCodes.add(ord.code);
        ordersData.push({
          id: ord.id,
          code: ord.code,
          customerName: ord.customerName,
          customerMobile: ord.customerMobile,
          customerCity: ord.customerCity ?? null,
          customerAddress: ord.customerAddress ?? null,
          customerNotes: ord.customerNotes ?? null,
          preferredContact: (ord.preferredContact || 'WHATSAPP') as any,
          lines: ord.lines ?? [],
          totalPrice: ord.totalPrice !== undefined && ord.totalPrice !== null ? Number(ord.totalPrice) : null,
          messageText: ord.messageText || '',
          status: (ord.status || 'NEW') as any,
          channelType: ord.channelType ?? null,
          channelValue: ord.channelValue ?? null,
          createdAt: parseDate(ord.createdAt),
          updatedAt: parseDate(ord.updatedAt),
        });
      }
    }
    stats['Orders'] = await insertInChunks('Orders', ordersData, 100, (chunk) =>
      prisma.order.createMany({ data: chunk, skipDuplicates: true })
    );

    // 1.7 Slug Redirects (Deduplicated on [entityType, oldSlug])
    const redirectsRaw = loadJson<any[]>('slug-redirects.json', []);
    const redirectMap = new Map<string, any>();
    for (const red of redirectsRaw) {
      const key = `${red.entityType}_${red.oldSlug}`;
      redirectMap.set(key, {
        id: red.id,
        entityType: (red.entityType || 'PRODUCT') as any,
        oldSlug: red.oldSlug,
        targetId: red.targetId,
        createdAt: parseDate(red.createdAt),
      });
    }
    const redirectsData = Array.from(redirectMap.values());
    stats['SlugRedirects'] = await insertInChunks('SlugRedirects', redirectsData, 100, (chunk) =>
      prisma.slugRedirect.createMany({ data: chunk, skipDuplicates: true })
    );

    // 1.8 Feedbacks
    const feedbacksRaw = loadJson<any[]>('feedbacks.json', []);
    const feedbackSeenCodes = new Set<string>();
    const feedbacksData: any[] = [];
    for (const fb of feedbacksRaw) {
      if (fb.trackingCode && !feedbackSeenCodes.has(fb.trackingCode)) {
        feedbackSeenCodes.add(fb.trackingCode);
        feedbacksData.push({
          id: fb.id,
          trackingCode: fb.trackingCode,
          name: fb.name,
          phone: fb.phone,
          type: (fb.type || 'SUGGESTION') as any,
          message: fb.message,
          status: (fb.status || 'UNREAD') as any,
          adminNote: fb.adminNote ?? null,
          publicReply: fb.publicReply ?? null,
          ip: fb.ip ?? null,
          createdAt: parseDate(fb.createdAt),
          updatedAt: parseDate(fb.updatedAt),
        });
      }
    }
    stats['Feedbacks'] = await insertInChunks('Feedbacks', feedbacksData, 100, (chunk) =>
      prisma.feedback.createMany({ data: chunk, skipDuplicates: true })
    );

    // 1.9 Homepage Sections
    const sectionsRaw = loadJson<any[]>('homepage-sections.json', []);
    const sectionsData = sectionsRaw.map((s) => ({
      id: s.id,
      type: (s.type || 'HERO') as any,
      template: s.template || 'default',
      status: (s.status || 'DRAFT') as any,
      sortOrder: Number(s.sortOrder) || 0,
      background: (s.background || 'NONE') as any,
      internalName: s.internalName || 'Section',
      content: s.content ?? {},
      createdAt: parseDate(s.createdAt),
      updatedAt: parseDate(s.updatedAt),
    }));
    stats['HomepageSections'] = await insertInChunks('HomepageSections', sectionsData, 100, (chunk) =>
      prisma.homepageSection.createMany({ data: chunk, skipDuplicates: true })
    );
    const validSectionIds = new Set(sectionsData.map((s) => s.id));

    // 1.10 Accounts (Dependent on Users)
    const accountsRaw = loadJson<any[]>('accounts.json', []);
    const accountsData = accountsRaw
      .filter((a) => validUserIds.has(a.userId))
      .map((a) => ({
        id: a.id,
        userId: a.userId,
        accountId: a.accountId || a.userId,
        providerId: a.providerId || 'credential',
        password: a.password ?? null,
        createdAt: parseDate(a.createdAt),
        updatedAt: parseDate(a.updatedAt),
      }));
    stats['Accounts'] = await insertInChunks('Accounts', accountsData, 100, (chunk) =>
      prisma.account.createMany({ data: chunk, skipDuplicates: true })
    );

    // 1.11 Sessions (Dependent on Users)
    const sessionsRaw = loadJson<any[]>('sessions.json', []);
    const sessionSeenTokens = new Set<string>();
    const sessionsData: any[] = [];
    for (const sess of sessionsRaw) {
      if (sess.token && !sessionSeenTokens.has(sess.token) && validUserIds.has(sess.userId)) {
        sessionSeenTokens.add(sess.token);
        sessionsData.push({
          id: sess.id,
          userId: sess.userId,
          token: sess.token,
          expiresAt: parseDate(sess.expiresAt),
          ipAddress: sess.ipAddress ?? null,
          userAgent: sess.userAgent ?? null,
          createdAt: parseDate(sess.createdAt),
          updatedAt: parseDate(sess.updatedAt),
        });
      }
    }
    stats['Sessions'] = await insertInChunks('Sessions', sessionsData, 100, (chunk) =>
      prisma.session.createMany({ data: chunk, skipDuplicates: true })
    );

    // 1.12 Site Settings (Singleton id=1)
    const settingsRaw = loadJson<any>('site-settings.json', { id: 1, siteNameFa: 'عسل باباخُرم' });
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
        address: settingsRaw.address ?? null,
        workingHours: settingsRaw.workingHours ?? null,
        latitude: settingsRaw.latitude !== undefined && settingsRaw.latitude !== null ? Number(settingsRaw.latitude) : null,
        longitude: settingsRaw.longitude !== undefined && settingsRaw.longitude !== null ? Number(settingsRaw.longitude) : null,
        mapZoom: settingsRaw.mapZoom !== undefined && settingsRaw.mapZoom !== null ? Number(settingsRaw.mapZoom) : null,
        copyrightText: settingsRaw.copyrightText ?? null,
        seoTitle: settingsRaw.seoTitle ?? null,
        seoDescription: settingsRaw.seoDescription ?? null,
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
        address: settingsRaw.address ?? null,
        workingHours: settingsRaw.workingHours ?? null,
        latitude: settingsRaw.latitude !== undefined && settingsRaw.latitude !== null ? Number(settingsRaw.latitude) : null,
        longitude: settingsRaw.longitude !== undefined && settingsRaw.longitude !== null ? Number(settingsRaw.longitude) : null,
        mapZoom: settingsRaw.mapZoom !== undefined && settingsRaw.mapZoom !== null ? Number(settingsRaw.mapZoom) : null,
        copyrightText: settingsRaw.copyrightText ?? null,
        seoTitle: settingsRaw.seoTitle ?? null,
        seoDescription: settingsRaw.seoDescription ?? null,
        cartEnabled: Boolean(settingsRaw.cartEnabled),
        cartNotice: settingsRaw.cartNotice || 'قیمت و هزینه‌ی ارسال پس از تأیید اعلام می‌شود.',
        orderIntroText: settingsRaw.orderIntroText ?? null,
        orderOutroText: settingsRaw.orderOutroText ?? null,
        isPlaceholder: Boolean(settingsRaw.isPlaceholder),
        updatedAt: parseDate(settingsRaw.updatedAt),
      },
    });
    stats['SiteSettings'] = 1;
    console.log('  ✅ SiteSettings: 1 singleton record upserted.\n');

    // -------------------------------------------------------------------------
    // STEP 2: Products & Products Child/Junction Tables
    // -------------------------------------------------------------------------
    console.log('🍯 3. Migrating Products, Benefits, Options & Categories...');

    const productsRaw = loadJson<any[]>('products.json', []);
    const productOptionsRaw = loadJson<any[]>('product-options.json', []);
    const productGalleryRaw = loadJson<any[]>('product-gallery.json', []);

    // 2.1 Products
    const productsData = productsRaw.map((p) => {
      const mainImageId = p.mainImageId && validAssetIds.has(p.mainImageId) ? p.mainImageId : null;
      return {
        id: p.id,
        slug: p.slug,
        nameFa: p.nameFa,
        nameOriginal: p.nameOriginal ?? null,
        status: (p.status || 'DRAFT') as any,
        isAvailable: p.isAvailable !== undefined ? Boolean(p.isAvailable) : true,
        isFeatured: p.isFeatured !== undefined ? Boolean(p.isFeatured) : false,
        cardTheme: (p.cardTheme || 'AUTO') as any,
        sortOrder: Number(p.sortOrder) || 0,
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
      };
    });
    stats['Products'] = await insertInChunks('Products', productsData, 100, (chunk) =>
      prisma.product.createMany({ data: chunk, skipDuplicates: true })
    );
    const validProductIds = new Set(productsData.map((p) => p.id));

    // 2.2 Product Benefits
    const benefitsData: any[] = [];
    for (const p of productsRaw) {
      if (Array.isArray(p.benefits) && validProductIds.has(p.id)) {
        p.benefits.forEach((benefitText: string, idx: number) => {
          benefitsData.push({
            id: `pbn_${p.id}_${idx}`,
            productId: p.id,
            text: String(benefitText),
            sortOrder: idx,
          });
        });
      }
    }
    stats['ProductBenefits'] = await insertInChunks('ProductBenefits', benefitsData, 100, (chunk) =>
      prisma.productBenefit.createMany({ data: chunk, skipDuplicates: true })
    );

    // 2.3 Product Options (Merge products.options + product-options.json)
    const optionsMap = new Map<string, any>();
    for (const p of productsRaw) {
      if (Array.isArray(p.options) && validProductIds.has(p.id)) {
        for (const opt of p.options) {
          if (opt.id) {
            optionsMap.set(opt.id, {
              id: opt.id,
              productId: p.id,
              label: opt.label || 'وزن پیش‌فرض',
              isAvailable: opt.isAvailable !== undefined ? Boolean(opt.isAvailable) : true,
              sortOrder: Number(opt.sortOrder) || 0,
              createdAt: parseDate(opt.createdAt || p.createdAt),
              updatedAt: parseDate(opt.updatedAt || p.updatedAt),
            });
          }
        }
      }
    }
    for (const opt of productOptionsRaw) {
      if (opt.id && validProductIds.has(opt.productId) && !optionsMap.has(opt.id)) {
        optionsMap.set(opt.id, {
          id: opt.id,
          productId: opt.productId,
          label: opt.label || 'وزن پیش‌فرض',
          isAvailable: opt.isAvailable !== undefined ? Boolean(opt.isAvailable) : true,
          sortOrder: Number(opt.sortOrder) || 0,
          createdAt: parseDate(opt.createdAt),
          updatedAt: parseDate(opt.updatedAt),
        });
      }
    }
    const productOptionsData = Array.from(optionsMap.values());
    stats['ProductOptions'] = await insertInChunks('ProductOptions', productOptionsData, 100, (chunk) =>
      prisma.productOption.createMany({ data: chunk, skipDuplicates: true })
    );

    // 2.4 Product Categories (Junction)
    const productCategoryMap = new Map<string, any>();
    for (const p of productsRaw) {
      if (validProductIds.has(p.id)) {
        const catIds: string[] = Array.isArray(p.categoryIds) ? p.categoryIds : [];
        if (p.categorySlug) {
          const matched = categoriesData.find((c) => c.slug === p.categorySlug && c.type === 'PRODUCT');
          if (matched && !catIds.includes(matched.id)) {
            catIds.push(matched.id);
          }
        }
        for (const cId of catIds) {
          if (validCategoryIds.has(cId)) {
            const key = `${p.id}_${cId}`;
            productCategoryMap.set(key, {
              productId: p.id,
              categoryId: cId,
            });
          }
        }
      }
    }
    const productCategoriesData = Array.from(productCategoryMap.values());
    stats['ProductCategories'] = await insertInChunks('ProductCategories', productCategoriesData, 100, (chunk) =>
      prisma.productCategory.createMany({ data: chunk, skipDuplicates: true })
    );

    // 2.5 Product Gallery Items
    const productGalleryMap = new Map<string, any>();
    for (const gi of productGalleryRaw) {
      if (validProductIds.has(gi.productId) && validAssetIds.has(gi.assetId)) {
        const key = `${gi.productId}_${gi.assetId}`;
        if (!productGalleryMap.has(key)) {
          productGalleryMap.set(key, {
            id: gi.id || `pgi_${gi.productId}_${gi.assetId}`,
            productId: gi.productId,
            assetId: gi.assetId,
            sortOrder: Number(gi.sortOrder) || 0,
          });
        }
      }
    }
    const productGalleryData = Array.from(productGalleryMap.values());
    stats['ProductGallery'] = await insertInChunks('ProductGallery', productGalleryData, 100, (chunk) =>
      prisma.productGalleryItem.createMany({ data: chunk, skipDuplicates: true })
    );

    // -------------------------------------------------------------------------
    // STEP 3: Recipes & Recipe Child/Junction Tables
    // -------------------------------------------------------------------------
    console.log('\n🍵 4. Migrating Recipes, Ingredients, Steps & Categories...');

    const recipesRaw = loadJson<any[]>('recipes.json', []);
    const recipeGalleryRaw = loadJson<any[]>('recipe-gallery.json', []);

    // 3.1 Recipes
    const recipesData = recipesRaw.map((r) => {
      const mainImageId = r.mainImageId && validAssetIds.has(r.mainImageId) ? r.mainImageId : null;
      return {
        id: r.id,
        slug: r.slug,
        nameFa: r.nameFa,
        nameOriginal: r.nameOriginal ?? null,
        country: r.country ?? null,
        servingTypes: Array.isArray(r.servingTypes) ? (r.servingTypes as any[]) : [],
        yieldText: r.yieldText ?? null,
        shortDescription: r.shortDescription ?? null,
        longDescription: r.longDescription ?? null,
        status: (r.status || 'DRAFT') as any,
        isFeatured: r.isFeatured !== undefined ? Boolean(r.isFeatured) : false,
        cardTheme: (r.cardTheme || 'AUTO') as any,
        sortOrder: Number(r.sortOrder) || 0,
        mainImageId,
        focalPoint: r.focalPoint || 'center',
        searchText: r.searchText || '',
        createdAt: parseDate(r.createdAt),
        updatedAt: parseDate(r.updatedAt),
      };
    });
    stats['Recipes'] = await insertInChunks('Recipes', recipesData, 100, (chunk) =>
      prisma.recipe.createMany({ data: chunk, skipDuplicates: true })
    );
    const validRecipeIds = new Set(recipesData.map((r) => r.id));

    // 3.2 Recipe Ingredients
    const ingredientsData: any[] = [];
    for (const r of recipesRaw) {
      if (Array.isArray(r.ingredients) && validRecipeIds.has(r.id)) {
        r.ingredients.forEach((ing: any, idx: number) => {
          ingredientsData.push({
            id: ing.id || `ring_${r.id}_${idx}`,
            recipeId: r.id,
            name: ing.name || 'ماده اولیه',
            quantityText: ing.quantityText ?? null,
            unit: ing.unit ?? null,
            equivalentText: ing.equivalentText ?? null,
            isOptional: Boolean(ing.isOptional),
            note: ing.note ?? null,
            sortOrder: Number(ing.sortOrder) ?? idx,
          });
        });
      }
    }
    stats['RecipeIngredients'] = await insertInChunks('RecipeIngredients', ingredientsData, 100, (chunk) =>
      prisma.recipeIngredient.createMany({ data: chunk, skipDuplicates: true })
    );

    // 3.3 Recipe Steps
    const stepsData: any[] = [];
    for (const r of recipesRaw) {
      if (Array.isArray(r.steps) && validRecipeIds.has(r.id)) {
        r.steps.forEach((st: any, idx: number) => {
          stepsData.push({
            id: st.id || `rstp_${r.id}_${idx}`,
            recipeId: r.id,
            text: st.text || '',
            sortOrder: Number(st.sortOrder) ?? idx,
          });
        });
      }
    }
    stats['RecipeSteps'] = await insertInChunks('RecipeSteps', stepsData, 100, (chunk) =>
      prisma.recipeStep.createMany({ data: chunk, skipDuplicates: true })
    );

    // 3.4 Recipe Categories (Junction)
    const recipeCategoryMap = new Map<string, any>();
    for (const r of recipesRaw) {
      if (validRecipeIds.has(r.id)) {
        const catIds: string[] = Array.isArray(r.categoryIds) ? r.categoryIds : [];
        if (Array.isArray(r.categories)) {
          for (const slugOrName of r.categories) {
            const matched = categoriesData.find(
              (c) => (c.slug === slugOrName || c.name === slugOrName) && c.type === 'RECIPE'
            );
            if (matched && !catIds.includes(matched.id)) {
              catIds.push(matched.id);
            }
          }
        }
        for (const cId of catIds) {
          if (validCategoryIds.has(cId)) {
            const key = `${r.id}_${cId}`;
            recipeCategoryMap.set(key, {
              recipeId: r.id,
              categoryId: cId,
            });
          }
        }
      }
    }
    const recipeCategoriesData = Array.from(recipeCategoryMap.values());
    stats['RecipeCategories'] = await insertInChunks('RecipeCategories', recipeCategoriesData, 100, (chunk) =>
      prisma.recipeCategory.createMany({ data: chunk, skipDuplicates: true })
    );

    // 3.5 Recipe Gallery Items
    const recipeGalleryMap = new Map<string, any>();
    for (const gi of recipeGalleryRaw) {
      if (validRecipeIds.has(gi.recipeId) && validAssetIds.has(gi.assetId)) {
        const key = `${gi.recipeId}_${gi.assetId}`;
        if (!recipeGalleryMap.has(key)) {
          recipeGalleryMap.set(key, {
            id: gi.id || `rgi_${gi.recipeId}_${gi.assetId}`,
            recipeId: gi.recipeId,
            assetId: gi.assetId,
            sortOrder: Number(gi.sortOrder) || 0,
          });
        }
      }
    }
    const recipeGalleryData = Array.from(recipeGalleryMap.values());
    stats['RecipeGallery'] = await insertInChunks('RecipeGallery', recipeGalleryData, 100, (chunk) =>
      prisma.recipeGalleryItem.createMany({ data: chunk, skipDuplicates: true })
    );

    // -------------------------------------------------------------------------
    // STEP 4: Section Items & Audit Logs
    // -------------------------------------------------------------------------
    console.log('\n📑 5. Migrating Section Items and Audit Logs...');

    // 4.1 Section Items
    const sectionItemsData: any[] = [];
    for (const sec of sectionsRaw) {
      if (Array.isArray(sec.items) && validSectionIds.has(sec.id)) {
        sec.items.forEach((item: any, idx: number) => {
          const productId = item.productId && validProductIds.has(item.productId) ? item.productId : null;
          const recipeId = item.recipeId && validRecipeIds.has(item.recipeId) ? item.recipeId : null;
          sectionItemsData.push({
            id: item.id || `sitem_${sec.id}_${idx}`,
            sectionId: sec.id,
            productId,
            recipeId,
            sortOrder: Number(item.sortOrder) ?? idx,
          });
        });
      }
    }
    stats['SectionItems'] = await insertInChunks('SectionItems', sectionItemsData, 100, (chunk) =>
      prisma.sectionItem.createMany({ data: chunk, skipDuplicates: true })
    );

    // 4.2 Audit Logs
    const auditLogsRaw = loadJson<any[]>('audit-logs.json', []);
    const auditLogsData = auditLogsRaw.map((log) => ({
      id: log.id,
      userId: log.userId ?? null,
      action: log.action || 'ACTION',
      entityType: log.entityType || 'ENTITY',
      entityId: log.entityId ?? null,
      summary: log.summary || '',
      ip: log.ip ?? null,
      userAgent: log.userAgent ?? null,
      createdAt: parseDate(log.createdAt),
    }));
    stats['AuditLogs'] = await insertInChunks('AuditLogs', auditLogsData, 100, (chunk) =>
      prisma.auditLog.createMany({ data: chunk, skipDuplicates: true })
    );

    // -------------------------------------------------------------------------
    // SUMMARY REPORT
    // -------------------------------------------------------------------------
    console.log('\n========================================================================');
    console.log('🎉 MIGRATION FINISHED SUCCESSFULLY! SUMMARY:');
    console.log('========================================================================');
    console.table(stats);
    console.log('\n✨ All mock JSON files have been safely migrated to PostgreSQL.');
  } catch (error) {
    console.error('\n❌ [MIGRATION ERROR]', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
