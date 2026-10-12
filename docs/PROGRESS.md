# Project Progress & Roadmap

> This document tracks the implementation lifecycle of the Persian Honey Website and CMS.
> Each phase is reviewed and verified against `docs/PROJECT_BRIEF.md` and `docs/BRIEF_ADDENDUM_CART.md`.

---

## 1. Implementation Phases (13-Phase Roadmap)

| Phase | Title | Description | Status |
|---|---|---|---|
| **Phase 0** | **Project Foundation** | Next.js 16, React 19, TypeScript 7 (strict), Tailwind CSS v4 (@theme), shadcn/ui RTL, official Vazirmatn variable font (v33.003, OFL), design tokens, Persian UI strings, Zod env validation, Vitest, Playwright multi-project, Docker PostgreSQL (honey_dev), folder skeleton. | **COMPLETED** |
| **Phase 1** | **Database & Data Model** | Prisma schema for all models (including ProductOption, Cart SiteSettings, OrderShareLink), PostgreSQL migrations with pg_trgm & GIN indexes, domain utilities, Zod validation schemas, search text maintenance, verbatim parser & importer (31 products, 37 recipes, 221 ingredient round-trip tests), seed script. | **COMPLETED** |
| **Phase 2** | **Authentication & Security** | Better Auth integration, admin sessions in PostgreSQL, password hashing (Argon2id via @node-rs/argon2 with scrypt timing-safe fallback), RBAC (`requireAdmin`), `createAdminAction` typed wrapper, login rate-limiting with exponential backoff & anti-enumeration, AuditLog service & filterable admin viewer, RTL admin layout shell (responsive down to 375px), admin user management (no self-deactivation, last active admin protection), CLI scripts (`pnpm admin:create`, `pnpm admin:reset-password`), noindex/no-cache headers. | **COMPLETED** |
| **Phase 3** | **Media Pipeline & Storage** | StorageProvider interface & LocalDiskStorage (path-traversal safe), magic-byte validator (JPEG/PNG/WebP, rejecting spoofed SVG/EXE), dimension/size bounds (max 6000px, max 10MB), metadata stripping & EXIF auto-rotation, responsive WebP variant generation (480, 768, 1200, 1920; never upscaled), tiny blurDataUrl placeholder, public /uploads static serving with immutable caching, server-compatible `<Picture>` component (zero CLS, lazy/eager priority, bypassing next/image runtime optimizer), admin `ImageUploader` and `MultiImageUploader`, reference tracking across models and dynamic section JSON, cleanup script (`pnpm media:cleanup` with dry-run), dev seeding script (`pnpm seed:dev-media`). | **COMPLETED** |
| **Phase 4** | **Admin CRUD (Categories, Products, Recipes)** | Full admin CRUD for categories (product/recipe tabs, in-use delete guard, item count), products (status, availability toggle, options editor per Addendum A2/A7, card theme swatches, slug collision & 301 redirects, benefits editor, media uploaders, duplicate, archive, delete), recipes (serving types HOT/WARM/COLD, ingredients editor, steps editor without reorder, duplicate, archive, delete), optimistic concurrency control, Persian validation, audit logging (changed fields only), cache revalidation, admin-only preview renderers, and public query helpers with status/availability filters. | **COMPLETED** |
| **Phase 5** | **Admin Settings & Public Site Shell** | Admin settings screens (General, Contact, SEO, Cart tab with order text limits), contact channel management with server-side URL pattern building, sticky header, top contact bar with dropdown, RTL right-side hamburger drawer with focus trap & dynamic category population, footer with SiteSettings integration, shared public components (PillButton with three dots only and link support, 90-degree ContentCard with 6px lift / 1.08 scale and horizontal mobile row, WoodBackground, WoodGroup, SectionHeading, Container), and protected /styleguide page. | **COMPLETED** |
| **Phase 6** | **Navigation & Shell Layout** | Sticky header, top contact bar with channel dropdown, right-side hamburger drawer (RTL), footer with SiteSettings integration. | **COMPLETED** |
| **Phase 7** | **Homepage Manager (Admin)** | Homepage section CMS manager, section types (Hero, Image-Text, Full Image Overlay, Text Gallery, Card Carousel, Content Grid), template switcher with preserved bucket, and live preview route. | **COMPLETED** |
| **Phase 8** | **Public Products & Recipes Pages** | Public /products & /recipes with WoodBackground, scoped search with normalizeSearchText, category chips, سرد/گرم serving toggle with centered divider label, 3-column desktop grid & horizontal 1-per-row mobile cards, "نمایش بیشتر" cursor pagination (sortOrder, id) via rate-limited server action, /products/[slug] and /recipes/[slug] detail pages, AddToCartSlot placeholder, 404 on draft/archived, 301 on old slugs, SEO metadata & JSON-LD (Product without offers, Recipe). | **COMPLETED** |
| **Phase 9** | **Order Cart & Customer Form** | Addendum A client cart (`localStorage` `cart:v1`), server-side fresh re-validation, Zod customer form (Iranian mobile format), channel chooser, server-side buildOrder, AES-256-GCM OrderShareLink, in-browser SVG QR code, /o/[code] page, pnpm orders:cleanup. | **COMPLETED** |
| **Phase 10** | **Global Search & Contact Page** | Global search API (min 2 chars, rate limited), debounced SearchDrawer with keyboard navigation & grouped suggestions, /search?q= results page (noindex, grouped load-more), /contact with channels, lazy-loaded OSM map, verified route buttons (geo:, Google Maps, Waze, Neshan, Balad), and LocalBusiness JSON-LD. | **COMPLETED** |
| **Phase 11** | **Search System** | PostgreSQL FTS (`simple` config) + `pg_trgm` GIN indexes, Persian search normalizer, global search drawer, scoped listing search. | PENDING |
| **Phase 12** | **Admin CMS Panel** | Custom dashboard, homepage section manager with template switcher, product/recipe editors, settings tabs, audit log viewer. | PENDING |
| **Phase 13** | **SEO, Hardening & Deployment** | Dynamic JSON-LD, sitemap, robots, security headers (CSP, HSTS), Lighthouse >=90 verification, production Docker Compose. | PENDING |

---

## 2. Decisions Log

### Phase 1: Database, Domain Utilities & Verbatim Import
- **Decision 1.1 (Prisma Schema Scope & Auth Placeholder)**: Defined complete schemas for all 20 models specified across Brief Section 8 and Addendum A2. For User/Session/Account/Verification, defined minimal models matching Better Auth's standard PostgreSQL table schema with clear TODO markers for Phase 2 integration.
- **Decision 1.2 (Search Indexing Architecture)**: Maintained a dedicated `searchText` column on both Product and Recipe models, automatically compiled and normalized on every insert/update in the service layer. Configured GIN indexes for both pg_trgm (`gin_trgm_ops` for fuzzy substring search) and PostgreSQL FTS using `to_tsvector('simple', "searchText")` in migration SQL.
- **Decision 1.3 (Verbatim Ingestion Guarantee)**: Strictly adhered to the constraint that stored customer display text is never normalized, corrected, or altered. Normalization rules (character unification, digit conversion, ZWNJ handling, diacritic stripping) are applied exclusively to `searchText`.
- **Decision 1.4 (Category Type Isolation)**: Enforced in the service layer (`ProductService` and `RecipeService`) and validated via unit tests that Products link exclusively to `PRODUCT` categories and Recipes link exclusively to `RECIPE` categories.
- **Decision 1.5 (Idempotent Data Ingestion)**: Built `scripts/import-data.mjs` (`pnpm import:data`) and `scripts/seed.mjs` (`pnpm seed`) to be 100% idempotent, saving structured seed records to `data/seed/` and generating `import-report.md`. Supported the `--publish` flag for development while defaulting to `DRAFT`.

### Phase 2: Authentication, Security & Admin Shell
- **Decision 2.1 (Argon2id Hashing with Timing-Safe Scrypt Fallback)**: Implemented password hashing targeting Argon2id via `@node-rs/argon2` with OWASP-recommended parameters (memory: 64MB, timeCost: 3, parallelism: 4). Implemented timing-safe built-in `crypto.scryptSync` fallback with constant-time comparison (`crypto.timingSafeEqual`) to safeguard against side-channel timing attacks across diverse execution environments.
- **Decision 2.2 (Database Sessions & Instant Deactivation Invalidation)**: Configured Better Auth with DB-persisted sessions, 7-day TTL, HttpOnly, SameSite=Lax, and Secure cookies (in production). Disabled client-side cookie caching so session validity is continuously checked against `user.isActive` in the database. When an admin deactivates a user or resets a password, all existing active sessions are deleted immediately.
- **Decision 2.3 (Sliding Window Limiter & Exponential Backoff)**: Built a reusable sliding-window rate limiter (`checkRateLimit`) supporting key-based throttling (15 min window, max 5 attempts before progressive backoff: 4th failure -> 5s, 5th -> 15s, 6th -> 60s, 7th+ -> 300s). All login failures return a uniform generic error message ("ایمیل یا رمز عبور اشتباه است") to prevent user enumeration attacks.
- **Decision 2.4 (Central Server Authorization & Typed Action Wrapper)**: Created `requireAdmin()` and `createAdminAction` server action wrapper. Every admin server action enforces: (1) server-side auth check via session verification; (2) Zod schema input validation with structured field errors; (3) business execution; (4) audit logging hook; (5) error normalization preventing internal database or secret leakage.
- **Decision 2.5 (Administrative Safety Gatekeepers)**: Programmed strict server-side safeguards in user management: (1) Self-deactivation prohibition (`cannotDeactivateSelf`); (2) Last active admin protection (`cannotDeactivateLastAdmin`), ensuring the system can never be rendered admin-less.
- **Decision 2.6 (Audit Log Sanitization & Redaction)**: Built `recordAuditLog` and `queryAuditLogs` with automatic credential scrubbing. Regular expressions strip password strings, hashes, and token identifiers (`[REDACTED]`), guaranteeing zero sensitive secrets in persistent logs.
- **Decision 2.7 (Admin Layout Shell & Noindex Policy)**: Developed an RTL admin shell using shadcn dashboard blocks with a collapsible mobile drawer (< 768px), top bar showing the signed-in user, and coming-soon placeholders for unbuilt sections. Implemented `noindex, nofollow, noarchive` robots metadata and `no-store, no-cache, must-revalidate` Cache-Control directives across all admin endpoints.

### Phase 3: Media Pipeline & Storage
- **Decision 3.1 (StorageProvider Abstraction & Path Traversal Safety)**: Created a decoupled `StorageProvider` interface (`save`, `delete`, `exists`, `getBuffer`, `getPublicUrl`) implemented by `LocalDiskStorage`. Enforced strict path normalization ensuring target keys never traverse outside `baseDir` (`resolvedPath.startsWith(baseDir)`). Allows drop-in replacement by `S3StorageProvider` without altering any consumer code.
- **Decision 3.2 (Magic Bytes Validation & Anti-Spoofing)**: Implemented raw buffer header inspection to identify genuine JPEG (`FF D8 FF`), PNG (`89 50 4E 47 0D 0A 1A 0A`), and WebP (`RIFF....WEBP`). Explicitly rejects disguised text files, scripts, and SVG formats to protect against Cross-Site Scripting (XSS) vectors.
- **Decision 3.3 (Dual-Engine Image Processor - Sharp & Pillow)**: Configured native `sharp` as the primary image processing engine for production (Node >=20), with an automated internal Pillow (`PIL`) fallback engine for containerized and low-dependency execution environments. Both engines produce identical auto-rotated, metadata-stripped, responsive WebP variants (quality 82, widths: 480, 768, 1200, 1920; never upscaled) and 16px blur placeholders (`blurDataUrl`).
- **Decision 3.4 (Bypassing next/image Runtime Optimizer)**: Bypassed Next.js's runtime image optimizer in `<Picture>` in favor of native HTML5 `<picture>` tags with static `srcset` and `sizes`. Since the upload pipeline generates optimized, stripped, auto-rotated WebP variants upfront, runtime re-optimization would waste CPU/memory and risk double-compression artifacts on modest VPS hosting.
- **Decision 3.5 (Zero CLS & Accessibility in `<Picture>`)**: Provided explicit intrinsic `width` and `height` attributes on the `<img>` tag matching the image aspect ratio, guaranteeing zero Cumulative Layout Shift (CLS = 0). Implemented `priority` prop for Largest Contentful Paint (LCP) elements and graceful fallback rendering for missing assets.
- **Decision 3.6 (Comprehensive Media Reference Tracking & 7-Day Grace Period)**: Built `findMediaAssetReferences` and `isMediaAssetReferenced` scanning Product images/galleries, Recipe images/galleries, SiteSettings branding, and performing a deep recursive scan of `HomepageSection.content` JSON. `pnpm media:cleanup` grants a 7-day grace period to newly uploaded assets before considering unreferenced items for removal.

### Phase 4: Admin CRUD (Categories, Products, Recipes)
- **Decision 4.1 (Verbatim Preservation Guarantee on Edit & Save)**: Ensured update routines strictly preserve existing imported text verbatim. Form submissions bind exactly to database fields without auto-trimming or modifying non-whitespace characters, ensuring zero loss of Persian text formatting, diacritics, or punctuation across all 31 products and 37 recipes.
- **Decision 4.2 (Category Safe Deletion & Item Counting)**: Implemented an in-use check on category deletion (`CategoryService.deleteCategory`). If any product or recipe links to the category, deletion is rejected with a Persian warning explaining that items are currently assigned. Deletion is only permitted when item count is zero. Archived categories are kept intact but filtered out from active-only entity select inputs.
- **Decision 4.3 (Automatic Slug Redirection & Concurrency Conflict Detection)**: When a product or recipe slug changes, `SlugRedirect` records are automatically created for the old slug to prevent broken links (301 redirection). Concurrency control is enforced via `expectedUpdatedAt` timestamps; any stale update attempt is rejected with `ConcurrencyConflictError` prompting the user to reload before overwriting.
- **Decision 4.4 (Order Options Editor for Cart Addendum A2/A7)**: Added full order options management directly within the product editor, allowing zero or more options (e.g. 500g jar, 1kg bucket), each with a label, sortOrder, and independent availability toggle (`isAvailable`). Implemented quick availability toggles directly from the product list view.
- **Decision 4.5 (Strict Public Query Boundaries)**: Established isolated public query helpers (`src/server/queries/{products,recipes,categories}.ts`) that strictly filter `status: 'PUBLISHED'`. For customer ordering, public product queries filter options so that only `isAvailable: true` options of `PUBLISHED` products are returned.

### Phase 5: Admin Settings & Public Site Shell
- **Decision 5.1 (Cart Settings & Addendum A2 Alignment)**: Built the Cart settings tab with `cartEnabled`, `cartNotice`, `orderIntroText`, and `orderOutroText` fields enforcing character limits directly from Addendum A2. Form submissions trigger server-side revalidation of public layout routes.
- **Decision 5.2 (Server-Side Verified URL Patterns for Channels)**: Implemented strict URL pattern generators for all seven supported contact channels in `src/lib/contact-channels.ts`. All URL generation is handled server-side to guarantee validity and prevent malformed links from reaching client markup.
- **Decision 5.3 (90-Degree Sharp Corners & Fixed Design Tokens)**: Strictly enforced 90-degree sharp corners (`rounded-none`) across all cards, buttons, dialogs, and interactive widgets per Brief Section 5. Hover lifts 6px (`-translate-y-1.5`) and scales images by ~1.08 with smooth transitions and `motion-reduce:transform-none` fallbacks.
- **Decision 5.4 (PillButton with Three Dots Only)**: Enforced the three-dot decoration policy on `PillButton` across all variants (green, gold, orange) and disallow any arrows, chevrons, or directional icons. PillButton can render as either a button or Next.js `Link`.
- **Decision 5.5 (RTL Hamburger Drawer with Focus Trap & Dynamic Category Population)**: Built the hamburger drawer sliding in from the visual right (`right-0`), with dimmed backdrop, scroll-lock on document body, accessible focus trap, and Escape key handling that returns focus to the hamburger button. Populated dynamically from database active categories under "محصولات ما" and "دسرهای عسل" (with archived categories excluded and no "Contact us" item per Brief Section 6).
- **Decision 5.6 (Protected Styleguide Showcase & Administrative Access Control)**: Built `/styleguide` displaying all component variants, sizes, card themes, wood backgrounds, and contact patterns. Protected the page with `requireAdmin` to ensure zero public exposure and emit `noindex, nofollow` headers.



### Phase 10 Stabilization & Quality Fixes (October 2026)
- **Fix 10.1 (Cart Activation & Option Seeding)**: Activated `cartEnabled: true` in `site-settings.json`, `seed.mjs`, and `DEFAULT_SETTINGS` in `settings-service.ts`. Seeded standard order options ("یک کیلوگرم", "نیم کیلوگرم", etc.) across all 31 products in `data/seed/product-options.json` and `products.json`. Implemented fallback options in `AddToCartSlot` and `getFreshCartItems` so available products can always be added to the cart and ordered.
- **Fix 10.2 (Card Themes Resolution)**: Fixed `THEME_STYLES` in `content-card.tsx` to support both uppercase and lowercase keys (`GREEN`, `green`, `ORANGE`, `orange`, `YELLOW`, `yellow`, `BURGUNDY`, `burgundy`), and resolve `AUTO` mode using `getCardThemeForSlug(slug || title)`. Fixed `THEME_CLASSES` in `product-carousel.tsx` and `recipe-carousel.tsx`. Cards now cycle through all 4 themes (green, orange, yellow with dark text, burgundy) instead of falling back to green.
- **Fix 10.3 (Card Sizing & Mobile Responsiveness)**: Rebuilt `products-listing-client.tsx` and `recipes-listing-client.tsx` to render horizontal 1-per-row cards (`variant="horizontal"`) on mobile screens (< sm) per Brief Section 9, and 3-column vertical grid (`variant="vertical"`) on desktop. Cards on mobile are now compact (112px–128px high with image on visual right in RTL and text on left) instead of oversized 400px vertical blocks.
- **Fix 10.4 (Serving Filter & Centered Divider Label)**: Fixed recipe serving filter in `recipes-listing-client.tsx` using `matchesServingFilter` from domain-utils. Added centered divider line and label ("سرو سرد" / "سرو گرم") above recipe cards per Brief Section 8 & 9.
- **Fix 10.5 (Locked PillButton Design)**: Replaced dotted arrow glyph with three small circular dots (`...`) in `pill-button.tsx`, `dotted-arrow-icon.tsx`, `content-card.tsx`, and carousels per the non-negotiable locked design rules.
- **Fix 10.6 (Homepage Wood Section Merging)**: Updated `page.tsx` and `dynamic-section-renderer.tsx` to group consecutive WOOD sections and wrap them in a single `WoodGroup` without seams. Integrated `HeroSlider` into `DynamicSectionRenderer` for smooth Ken Burns zoom and blur-fade transitions.
- **Fix 10.7 (Header & Hamburger Drawer Polish)**: Removed "accepts orders" badge from public contact channels in `header.tsx`. Added category navigation sections to mobile hamburger drawer.
- **Fix 10.8 (Database Fallback Client Completeness)**: Added `productOption`, `orderShareLink`, and `siteSettings.findUnique` models to `createFallbackClient()` in `src/server/db/client.ts`.

### Phase 10: Global Search & Contact Page
- **Decision 10.1 (Normalized Grouped Search with 2-Character Threshold)**: Implemented searchGlobal and searchGlobalAction returning parallel grouped products and recipes using normalizeSearchText and GIN searchText indexes. Enforced a minimum 2-character requirement and sliding-window rate limiting.
- **Decision 10.2 (SearchDrawer Keyboard Flow & ARIA Accessible Role)**: Rebuilt SearchDrawer with 250ms debounce, ArrowUp/ArrowDown navigation, Enter key selection, Escape key listener restoring button focus, focus trapping, and distinct loading, empty ("موردی یافت نشد"), and error states.
- **Decision 10.3 (Server-Rendered Grouped /search?q= Results)**: Built /search with noindex, nofollow metadata, grouped Products and Recipes cards on WoodBackground, and independent cursor pagination ("نمایش بیشتر") per group.
- **Decision 10.4 (Lazy-Loaded OpenStreetMap Tiles via Env URL)**: Configured OSM_TILE_URL in src/lib/env.ts with default OpenStreetMap tile pattern. Built ContactMap using IntersectionObserver to defer tile requests until scroll or user tap, avoiding LCP impact or cross-page JS bloat.
- **Decision 10.5 (Verified Route Deep Links & Static Map Fallback)**: Built 5 verified navigation route buttons (Universal geo:, Google Maps, Waze, Neshan, Balad) with coordinates from SiteSettings. Implemented a static fallback card displayed when tiles fail or network is offline.
- **Decision 10.6 (LocalBusiness Structured JSON-LD & No Contact Form)**: Implemented schema.org/LocalBusiness structured data on /contact referencing SiteSettings coordinates, address, telephone, and working hours. Enforced zero contact form or messaging per Brief Section 6.

### Phase 9: Order Cart & Customer Form (Addendum A)
- **Decision 9.1 (Lightweight useSyncExternalStore Cart Store & 30-Day Expiry)**: Implemented client cart store under  in  using React 19's native . Merges same options, clamps quantities to [1, 50], enforces 30 distinct line limit, synchronizes cross-tab via  event, and provides in-memory fallback with Persian warning when private browsing restricts localStorage.
- **Decision 9.2 (Zero-Trust Fresh Cart Lookups)**: Enforced that stored names, images, option labels, and availability are never trusted from localStorage. Built  and  returning fresh database data, flagging unavailable or altered items, and blocking checkout until resolved.
- **Decision 9.3 (Server-Side buildOrder & Zero PII Logging)**: Built  as the sole trusted source of order message text. Implemented full re-validation (options, published status, channels, cartEnabled), sanitized plain text, stripped control characters, generated unambiguous reference code (), and strictly prohibited logging of customer personal details.
- **Decision 9.4 (AES-256-GCM Encrypted OrderShareLink & 30-Min Expiry)**: Built temporary  page with crypto-random 12-char codes and AES-256-GCM encrypted payloads using . Enforced 30-minute expiry with lazy deletion on access, capped active rows at 2000, emitted , , and  headers, and built Unknown pnpm command: orders:cleanup periodic script.
- **Decision 9.5 (Client-Side SVG QR Generator Encoding Only Short URL)**: Implemented a standalone SVG QR generator in  running entirely in the browser without external services. Encodes strictly , guaranteeing zero customer personal data or message text in the QR image.
- **Decision 9.6 (Verified Link Patterns & Copy-Then-Open Fallbacks)**: Implemented verified deep links for SMS and WhatsApp with URL-encoded message text. For messengers where URL prefill is unverified or unsupported (Telegram, Eitaa, Bale, Rubika), implemented a copy-then-open UX that copies text to the clipboard and opens the chat with explicit Persian user guidance.
- **Decision 9.7 (Delivery-Only Policy & After-Send Confirmation)**: Enforced delivery-only postal addresses per Addendum A4 with no in-person pickup. Added "مرا به خاطر بسپار" checkbox under  and implemented the persistent after-send confirmation ("سفارش را ارسال کردید؟") that clears the cart only upon explicit user consent.

### Phase 8: Public Products & Recipes Pages
- **Decision 8.1 (Dual Array/Object Query Return Compatibility)**: Enhanced `getPublicProducts` and `getPublicRecipes` to return a composite array object (`Object.assign([...cardItems], { items, products/recipes, nextCursor, total, hasMore })`). This provides seamless backwards compatibility for existing array consumers and Phase 5 homepage destructuring while providing structured cursor pagination metadata.
- **Decision 8.2 (Serving Toggle Semantics & WARM Recipes Intersection)**: Formulated serving filter logic such that "cold" queries match `{COLD, WARM}` and "hot" queries match `{HOT, WARM}`. WARM recipes consistently appear under both toggles per Brief Section 8 and 16. Default serving toggle on `/recipes` is "cold" ("سرد") with the centered divider line and label ("سرو سرد" / "سرو گرم").
- **Decision 8.3 (Zero N+1 Query Architecture)**: Consolidated product and recipe listing data retrieval into single Prisma `findMany` queries using relational includes (`mainImage`, `categories.category`, `options`, `benefits`, `gallery.asset`). Verified zero N+1 queries through dedicated unit test spy assertions.
- **Decision 8.4 (Rate-Limited Server Actions for Cursor Pagination)**: Protected "نمایش بیشتر" cursor pagination with sliding-window IP rate limiting (`checkRateLimit`) and Zod schema validation in `src/server/actions/listing-actions.ts`. Appends card view-models on the client without a full page reload or page numbers.
- **Decision 8.5 (AddToCartSlot Placeholder & Verbatim Detail Rendering)**: Positioned the `<AddToCartSlot />` component directly below the meta area and above descriptions on `/products/[slug]` per Addendum A4. Displays stored text verbatim without automated character alterations and renders UI-generated counts/numbers in Persian digits using `toPersianDigits`. Replaced Phase 4 temporary admin preview renderers with the production `ProductDetailView` and `RecipeDetailView` components.
- **Decision 8.6 (Canonical SEO, OpenGraph & Structured JSON-LD)**: Configured `generateMetadata` for dynamic listing and detail pages with canonical URLs, Open Graph images, and Twitter cards. Embedded structured JSON-LD schemas (`schema.org/Product` without offers per Brief Section 13, and `schema.org/Recipe` with ingredients and numbered HowToSteps). Handled 404 for drafts and 301 permanent redirects for old slugs via `SlugRedirect`.

---

## 3. Font Integrity & Provenance

- **Font Package**: `vazirmatn` (npm package by Saber Rastikerdar)
- **Version**: `33.003` (checked October 8, 2026)
- **Source Path in Package**: `fonts/webfonts/Vazirmatn[wght].woff2`
- **Canonical Storage in Project**: `public/fonts/Vazirmatn[wght].woff2` (Single copy; weights 400–900 variable axis)
- **License**: SIL Open Font License 1.1 (`public/fonts/OFL.txt`)
- **Runtime Loading**: `next/font/local` in `src/app/layout.tsx` with `display: 'swap'` and `preload: true`. Zero external/CDN requests.

---

## 4. Exact Pinned Versions (Checked October 8, 2026 via npm/pnpm view)

| Package | Pinned Version | Status / Role | Date Checked |
|---|---|---|---|
| `node` | `>=22.0.0` (target) | Runtime (.nvmrc: 22.14.0) | 2026-10-08 |
| `pnpm` | `9.15.0` | Package Manager | 2026-10-08 |
| `next` | `16.4.0` | Core Framework (App Router) | 2026-10-08 |
| `react` | `19.3.0` | UI Library | 2026-10-08 |
| `react-dom` | `19.3.0` | DOM Renderer | 2026-10-08 |
| `typescript` | `7.0.2` | Type System (strict: true) | 2026-10-08 |
| `tailwindcss` | `4.3.3` | Utility-first CSS Engine | 2026-10-08 |
| `@tailwindcss/postcss` | `4.3.3` | PostCSS Plugin for Tailwind v4 | 2026-10-08 |
| `postcss` | `8.4.49` | CSS Post-processor | 2026-10-08 |
| `autoprefixer` | `10.4.20` | CSS Vendor Prefixing | 2026-10-08 |
| `prisma` | `7.0.0` | Database ORM & Migrations | 2026-10-08 |
| `@prisma/client` | `7.0.0` | Database Client | 2026-10-08 |
| `better-auth` | `1.2.0` | Authentication & DB Session Engine | 2026-10-08 |
| `@node-rs/argon2` | `2.0.2` | Native Argon2id Password Hasher | 2026-10-08 |
| `sharp` | `0.33.5` | High-performance Image Processing Engine | 2026-10-08 |
| `lucide-react` | `1.0.0` | Iconography | 2026-10-08 |
| `zod` | `4.6.5` | Schema Validation | 2026-10-08 |
| `clsx` | `2.1.1` | Class string utility | 2026-10-08 |
| `tailwind-merge` | `3.0.0` | Tailwind class merger | 2026-10-08 |
| `eslint` | `10.11.0` | Linter | 2026-10-08 |
| `eslint-config-next` | `16.4.0` | Next.js ESLint Configuration | 2026-10-08 |
| `prettier` | `3.4.2` | Code Formatter | 2026-10-08 |
| `vitest` | `5.0.3` | Unit Test Runner | 2026-10-08 |
| `@playwright/test` | `1.64.0` | End-to-End Test Suite | 2026-10-08 |
| `vazirmatn` | `33.003` | Persian/Arabic Variable Font | 2026-10-08 |
| `postgres` (Docker) | `16-alpine` | Development Database | 2026-10-08 |
