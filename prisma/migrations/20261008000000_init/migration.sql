-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN');

-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('PRODUCT', 'RECIPE');

-- CreateEnum
CREATE TYPE "CategoryStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ServingType" AS ENUM ('HOT', 'WARM', 'COLD');

-- CreateEnum
CREATE TYPE "CardTheme" AS ENUM ('AUTO', 'GREEN', 'ORANGE', 'YELLOW', 'BURGUNDY');

-- CreateEnum
CREATE TYPE "SectionType" AS ENUM ('HERO', 'IMAGE_TEXT', 'FULL_IMAGE_OVERLAY', 'TEXT_GALLERY', 'CARD_CAROUSEL', 'CONTENT_GRID');

-- CreateEnum
CREATE TYPE "SectionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "SectionBackground" AS ENUM ('NONE', 'WOOD');

-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('PHONE', 'WHATSAPP', 'TELEGRAM', 'EITAA', 'RUBIKA', 'BALE', 'INSTAGRAM');

-- CreateEnum
CREATE TYPE "RedirectEntityType" AS ENUM ('PRODUCT', 'RECIPE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "CategoryType" NOT NULL,
    "status" "CategoryStatus" NOT NULL DEFAULT 'ACTIVE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "blurDataUrl" TEXT,
    "variants" JSONB,
    "alt" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameFa" TEXT NOT NULL,
    "nameOriginal" TEXT,
    "status" "ItemStatus" NOT NULL DEFAULT 'DRAFT',
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "cardTheme" "CardTheme" NOT NULL DEFAULT 'AUTO',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "shortDescription" TEXT,
    "description" TEXT,
    "foodNature" TEXT,
    "vitamins" TEXT,
    "harvestSeason" TEXT,
    "harvestPlace" TEXT,
    "color" TEXT,
    "usageWarning" TEXT,
    "mainImageId" TEXT,
    "searchText" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_benefits" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_benefits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_options" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "productId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("productId","categoryId")
);

-- CreateTable
CREATE TABLE "product_gallery_items" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_gallery_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipes" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameFa" TEXT NOT NULL,
    "nameOriginal" TEXT,
    "country" TEXT,
    "servingTypes" "ServingType"[],
    "yieldText" TEXT,
    "shortDescription" TEXT,
    "longDescription" TEXT,
    "status" "ItemStatus" NOT NULL DEFAULT 'DRAFT',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "cardTheme" "CardTheme" NOT NULL DEFAULT 'AUTO',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "mainImageId" TEXT,
    "searchText" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_ingredients" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantityText" TEXT,
    "unit" TEXT,
    "equivalentText" TEXT,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "recipe_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_steps" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "recipe_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_categories" (
    "recipeId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "recipe_categories_pkey" PRIMARY KEY ("recipeId","categoryId")
);

-- CreateTable
CREATE TABLE "recipe_gallery_items" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "recipe_gallery_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homepage_sections" (
    "id" TEXT NOT NULL,
    "type" "SectionType" NOT NULL,
    "template" TEXT NOT NULL,
    "status" "SectionStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "background" "SectionBackground" NOT NULL DEFAULT 'NONE',
    "internalName" TEXT NOT NULL,
    "content" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homepage_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "section_items" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "productId" TEXT,
    "recipeId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "section_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "siteNameFa" TEXT NOT NULL DEFAULT 'عسل باباخُرم',
    "siteNameEn" TEXT,
    "tagline" TEXT,
    "logoId" TEXT,
    "footerLogoId" TEXT,
    "ogImageId" TEXT,
    "address" TEXT,
    "workingHours" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "mapZoom" INTEGER DEFAULT 14,
    "copyrightText" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "cartEnabled" BOOLEAN NOT NULL DEFAULT false,
    "cartNotice" TEXT NOT NULL DEFAULT 'قیمت و هزینه‌ی ارسال پس از تأیید اعلام می‌شود.',
    "orderIntroText" TEXT,
    "orderOutroText" TEXT,
    "isPlaceholder" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_channels" (
    "id" TEXT NOT NULL,
    "type" "ChannelType" NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "showInContactBar" BOOLEAN NOT NULL DEFAULT true,
    "showInFooter" BOOLEAN NOT NULL DEFAULT true,
    "showInContactPage" BOOLEAN NOT NULL DEFAULT true,
    "acceptsOrders" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_share_links" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "payloadEncrypted" TEXT NOT NULL,
    "channelType" "ChannelType" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_share_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slug_redirects" (
    "id" TEXT NOT NULL,
    "entityType" "RedirectEntityType" NOT NULL,
    "oldSlug" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slug_redirects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "summary" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE INDEX "categories_type_status_sortOrder_idx" ON "categories"("type", "status", "sortOrder");
CREATE UNIQUE INDEX "categories_type_slug_key" ON "categories"("type", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_storageKey_key" ON "media_assets"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");
CREATE INDEX "products_status_sortOrder_id_idx" ON "products"("status", "sortOrder", "id");
CREATE INDEX "products_isFeatured_idx" ON "products"("isFeatured");
CREATE INDEX "products_isAvailable_idx" ON "products"("isAvailable");
CREATE INDEX "products_slug_idx" ON "products"("slug");

-- CreateIndex
CREATE INDEX "product_benefits_productId_sortOrder_idx" ON "product_benefits"("productId", "sortOrder");

-- CreateIndex
CREATE INDEX "product_options_productId_sortOrder_idx" ON "product_options"("productId", "sortOrder");

-- CreateIndex
CREATE INDEX "product_categories_categoryId_idx" ON "product_categories"("categoryId");

-- CreateIndex
CREATE INDEX "product_gallery_items_productId_sortOrder_idx" ON "product_gallery_items"("productId", "sortOrder");
CREATE UNIQUE INDEX "product_gallery_items_productId_assetId_key" ON "product_gallery_items"("productId", "assetId");

-- CreateIndex
CREATE UNIQUE INDEX "recipes_slug_key" ON "recipes"("slug");
CREATE INDEX "recipes_status_sortOrder_id_idx" ON "recipes"("status", "sortOrder", "id");
CREATE INDEX "recipes_isFeatured_idx" ON "recipes"("isFeatured");
CREATE INDEX "recipes_slug_idx" ON "recipes"("slug");

-- CreateIndex
CREATE INDEX "recipe_ingredients_recipeId_sortOrder_idx" ON "recipe_ingredients"("recipeId", "sortOrder");

-- CreateIndex
CREATE INDEX "recipe_steps_recipeId_sortOrder_idx" ON "recipe_steps"("recipeId", "sortOrder");

-- CreateIndex
CREATE INDEX "recipe_categories_categoryId_idx" ON "recipe_categories"("categoryId");

-- CreateIndex
CREATE INDEX "recipe_gallery_items_recipeId_sortOrder_idx" ON "recipe_gallery_items"("recipeId", "sortOrder");
CREATE UNIQUE INDEX "recipe_gallery_items_recipeId_assetId_key" ON "recipe_gallery_items"("recipeId", "assetId");

-- CreateIndex
CREATE INDEX "homepage_sections_status_sortOrder_idx" ON "homepage_sections"("status", "sortOrder");

-- CreateIndex
CREATE INDEX "section_items_sectionId_sortOrder_idx" ON "section_items"("sectionId", "sortOrder");

-- CreateIndex
CREATE INDEX "contact_channels_isActive_sortOrder_idx" ON "contact_channels"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "order_share_links_code_key" ON "order_share_links"("code");
CREATE INDEX "order_share_links_code_idx" ON "order_share_links"("code");
CREATE INDEX "order_share_links_expiresAt_idx" ON "order_share_links"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "slug_redirects_entityType_oldSlug_key" ON "slug_redirects"("entityType", "oldSlug");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_mainImageId_fkey" FOREIGN KEY ("mainImageId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_benefits" ADD CONSTRAINT "product_benefits_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_options" ADD CONSTRAINT "product_options_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_gallery_items" ADD CONSTRAINT "product_gallery_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_gallery_items" ADD CONSTRAINT "product_gallery_items_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_mainImageId_fkey" FOREIGN KEY ("mainImageId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_steps" ADD CONSTRAINT "recipe_steps_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_categories" ADD CONSTRAINT "recipe_categories_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_categories" ADD CONSTRAINT "recipe_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_gallery_items" ADD CONSTRAINT "recipe_gallery_items_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_gallery_items" ADD CONSTRAINT "recipe_gallery_items_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_items" ADD CONSTRAINT "section_items_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "homepage_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_items" ADD CONSTRAINT "section_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_items" ADD CONSTRAINT "section_items_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ===============================================================
-- Raw SQL Extras (PostgreSQL Trigram, FTS & Domain Constraints)
-- ===============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "products_search_text_trgm_idx" ON "products" USING GIN ("searchText" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "recipes_search_text_trgm_idx" ON "recipes" USING GIN ("searchText" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "products_search_text_fts_idx" ON "products" USING GIN (to_tsvector('simple', "searchText"));
CREATE INDEX IF NOT EXISTS "recipes_search_text_fts_idx" ON "recipes" USING GIN (to_tsvector('simple', "searchText"));

ALTER TABLE "section_items"
  DROP CONSTRAINT IF EXISTS section_items_one_target_chk,
  ADD CONSTRAINT section_items_one_target_chk
  CHECK (("productId" IS NOT NULL)::int + ("recipeId" IS NOT NULL)::int = 1);

ALTER TABLE "site_settings"
  DROP CONSTRAINT IF EXISTS site_settings_single_row_chk,
  ADD CONSTRAINT site_settings_single_row_chk
  CHECK (id = 1);
