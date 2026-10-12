# PROJECT BRIEF: Persian Honey Brand Website + CMS

> Place this file in the repo at `docs/PROJECT_BRIEF.md`. It is the single source of truth for the implementing engineer (you), together with `docs/BRIEF_ADDENDUM_CART.md` (full cart/order specification; this brief summarizes it and the two are consistent; if they ever differ, the addendum wins). A separate supervisor AI reviews every phase. Read both files and `docs/PROGRESS.md` before every task.

## 0. Working agreement

- Status labels: **LOCKED** (never change), **DECIDED** (change only via a written proposal in your report), **DEFAULT** (supervisor's default; you may propose a better one with reasons).
- Do not start the next phase on your own. Do exactly the phase you were given.
- If something is ambiguous and blocking, ask one concise question. If it is not blocking, pick the simplest option consistent with this brief and flag it in the report under "Decisions I made".
- Your knowledge of library APIs may be outdated. **Before using Next.js, Prisma, Better Auth, Tailwind or shadcn/ui, read the official docs for the version you install** (especially caching/revalidation, async request APIs, config files and RTL support). Do not rely on memory. Pin exact versions in the lockfile and record them in `docs/PROGRESS.md`.
- Language rules: UI text is **Persian**. Code, comments, identifiers, commit messages and docs are **English**. All Persian UI strings live in one central file (`src/content/ui-strings.fa.ts`); no i18n library (single locale).
- `/reference` contains a static prototype by the product owner. It is a **visual reference only** (look, spacing, colors, card style, animations). Do not copy its architecture, do not import from it, exclude it from lint/tsc/build. Its images probably come from honey.com: use them only as **dev placeholders**; never ship them to production (seed scripts that use them must refuse to run when `NODE_ENV=production`).

## 1. Product summary (LOCKED)

A real, production-grade Persian (RTL) website for a honey business plus a custom CMS admin panel.
- The site **presents** products and recipes and offers an **order cart without payment**: visitors add products (with a quantity option such as "نیم کیلو" or "یک کیلو" and a count) to a cart and send the order text to the business by SMS (phones only) or by messenger (WhatsApp, Telegram, Eitaa, Bale, Rubika). There is no payment gateway, no prices, no accounts, and **orders are not stored** (details in section 9b and the addendum). Full e-commerce (prices, stock, payment, order management) may come later, so the architecture must allow adding it **without rewriting**, but none of that appears in the UI or CMS now.
- Visual style is inspired by honey.com (not a copy): brand-oriented, emotional, premium, responsive.
- Three principles: **Dynamic content** (everything from the database), **Controlled design** (admin edits content, never design), **Future-proof architecture**.
- Audience: Iran only. Public language: Persian only. Admin panel: Persian. No user accounts on the public site. No messaging system inside the site (orders leave the site through the visitor's own SMS/messenger app). No cookie banner (localStorage is used only for the functional cart), no analytics, no third-party trackers in v1.

## 2. Stack (LOCKED unless noted)

| Area | Choice |
|---|---|
| Framework | Next.js (latest stable, App Router), full-stack in ONE project: public site + admin + server logic. No separate backend. |
| Language | TypeScript, `strict: true` |
| Styling | Tailwind CSS using **logical properties** (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`) |
| Admin UI | shadcn/ui + official shadcn dashboard blocks (no heavy admin templates). Verify RTL support in the current shadcn docs and apply it. |
| Database (DECIDED) | PostgreSQL |
| ORM (DECIDED) | Prisma (follow current docs for config/generator) |
| Auth (DECIDED) | Better Auth, email + password, server-side sessions in DB, HttpOnly + Secure + SameSite=Lax cookie. Password hashing: Argon2id (e.g. `@node-rs/argon2`) via Better Auth's custom hash option; if that proves impractical, Better Auth's default scrypt is acceptable. Report which one. No public sign-up. No email sending in v1 (no email-based reset; reset via another admin or a CLI script). |
| Validation | Zod, on the server for every mutation and every public query parameter |
| Image processing (DECIDED) | `sharp` at upload time |
| Search (DECIDED) | PostgreSQL full-text + `pg_trgm` on a normalized search column. No Meilisearch/Elastic in v1. |
| Cache (DECIDED) | Next.js built-in cache with tag-based revalidation. No Redis. |
| Fonts | **Vazirmatn, self-hosted** (variable woff2 via `next/font/local` or equivalent). No Google Fonts or any external CDN at runtime. |
| Map | Leaflet + OpenStreetMap tiles, tile URL configurable by env, lazily loaded, with a static fallback (address + route buttons). No Google Maps. |
| Tests | Vitest (unit), Playwright (e2e smoke + authorization negative tests) |
| Deploy (DECIDED) | Docker Compose on an Iranian VPS: app (`output: standalone`), PostgreSQL, Nginx or Caddy. Host-agnostic. |
| Logging | `pino` to stdout, structured |

Do not add heavy dependencies without a reason in your report.

## 3. Architecture and rendering

- Public pages are **Server Components** by default. Client JS only for small islands: hero animation, carousel, drawers/menus, search UI, map, load-more, toggle.
- Public data flows `Database -> server data-access layer -> UI`. Nothing from the database is hard-coded in the frontend. The frontend never receives fields it does not render.
- Create a data-access layer (`src/server/queries/*`) with cached, tagged queries (tags such as `homepage`, `products`, `recipes`, `categories`, `settings`, plus per-entity tags). Admin mutations call revalidation for the affected tags/paths. Public pages must behave like static pages for visitors and update right after an admin saves.
- Admin: `Form -> Zod validation -> server action/route handler -> authorization check -> DB -> revalidate -> audit log`. Authorization is **always server-side**; hiding UI is never enough.
- Avoid N+1 queries (use `include/select` deliberately), add DB indexes for every filter/sort/cursor used, select only needed columns.
- Code layout suggestion (adapt if you have a good reason): `src/app/(public)`, `src/app/admin`, `src/components/{ui,public,admin}`, `src/server/{db,auth,queries,actions,services,storage,search}`, `src/lib`, `src/content`, `prisma/`, `scripts/`, `docs/`, `data/source/`, `reference/` (read-only).

## 4. Routes

Public (developer-defined; admins cannot create pages):
- `/` Homepage (section-based)
- `/products` listing, `/products/[slug]` detail
- `/recipes` listing, `/recipes/[slug]` detail
- `/contact`
- `/cart` (order cart, noindex, never cached) and `/o/[code]` (temporary order share page opened from a QR code, noindex, no-store); both return 404 when the cart is disabled
- `/search?q=` global search results
- `not-found`, error pages, `sitemap.xml`, `robots.txt`
- Slugs are **Latin** (`^[a-z0-9]+(?:-[a-z0-9]+)*$`), unique per entity type. Draft/archived items return 404 publicly.
- Category is **not** a page; it is a filter: `/recipes?category=tea&serving=cold`, `/products?category=honey`. Filters live in the URL and are server-rendered.

Admin (`/admin/...`): `login`, dashboard, `homepage` (+ section editor), `products` (+ new/edit), `recipes` (+ new/edit), `categories`, `settings`, `users`, `audit-log`, `preview/...`.

## 5. Design system (LOCKED look, values from the prototype)

Tokens (CSS variables / Tailwind theme):
- Honey `#F59E0B`, honey-dark `#C86A00`, amber `#D97706`, gold `#FBBF24`, light `#FEF3C7`, pale `#FFFBEB`
- Chocolate `#332115`, footer `#4B3A2F`, footer-nav `#403127`, text `#2B2017`, text-cream `#E8E2D9`, muted `#5C5248`, warm-bg `#FDFBF8`, border `#EFE9E0`
- Accent green `#3F8F3B`, accent orange `#E07D2B`
- **Card themes** (the only allowed card colors): green `#4CA849` (white text), orange `#E08B38` (white text), yellow `#F5A623` (dark text), burgundy `#9E3556` (white text). Extra colors may be added only if they harmonize with this palette; ask first.
- Breakpoints: 992px and 768px. Typography: Vazirmatn, weights 400/500/700/900; hero title about 3.4rem/900 on desktop, scaling down.
- Cards: sharp 90-degree corners, subtle shadow, hover lifts 6px and image scales ~1.08, image area 240px high (desktop), colored body with title and a link label.
- **Pill button** (LOCKED): rounded pill with a label followed by **three dots only** (three small circles). **No chevron/arrow glyph.** Variants: green, gold, orange. The card link ("مشاهده ...") uses the same three-dot ending.
- Wood background: asset `wood-bg` (dev placeholder from reference) with a dark overlay `rgba(35,20,10,0.45)`. It is a design asset, not editable by admins.
- `prefers-reduced-motion`: all decorative animation off or reduced to a simple fade.
- Never let admins control fonts, sizes, spacing, CSS, colors outside the allowed sets, layout structure or animation.

## 6. Header, contact bar, hamburger, footer (DECIDED)

- **Contact bar** (replaces the prototype's top utility bar): a slim bar above the header with one dropdown trigger (label e.g. "ارتباط با ما"). Opening it lists the enabled contact channels (icon + label). Choosing one navigates to it. Channels: phone, WhatsApp, Telegram, Eitaa, Rubika, Bale, Instagram. Admin stores only the number/username; the system builds the URL server-side from a fixed pattern table (`tel:`, `https://wa.me/<number>`, `https://t.me/<user>`, `https://eitaa.com/<user>`, `https://rubika.ir/<user>`, `https://ble.ir/<user>`, `https://instagram.com/<user>`). **Verify each pattern against official documentation and report any you could not verify.** Multiple channels of the same type are allowed. Each channel has an `acceptsOrders` flag (see section 9b). Validate values (digits/`+` for phone; `[A-Za-z0-9_.]` for usernames). The same channel data feeds the footer and the contact page.
- **Header**: sticky; logo; main nav (Home, Products, Recipes, Contact); search icon (opens a search drawer under the header); hamburger button (desktop AND mobile). On the homepage it may overlay the hero and gain a background after scrolling.
- **Hamburger drawer** (DECIDED): opens from the visual right (RTL), dimmed backdrop, focus trap, Escape to close, scroll lock. Content, all from the database:
  1. Section "محصولات ما": a link to `/products` followed by the **active product categories**.
  2. Section "دسرهای عسل": **active recipe categories** (links to `/recipes?category=<slug>`).
  - No "Contact us" item. Categories are not hard-coded; archived ones disappear. Near full-width on mobile, about 380px on desktop.
- **Footer**: primary links, address, working hours, phones, social/channels, location summary with a link to the contact page, logo, copyright. All values come from Site Settings and contact channels.

## 7. Homepage CMS (LOCKED model)

Homepage = ordered list of **sections**. Each has: `type`, `template`, `content` (validated JSON), `status` (DRAFT | ACTIVE | DISABLED), `sortOrder`, `background` (NONE | WOOD), `internalName` (admin label only).
Public site renders only ACTIVE sections in order.

Admin can: add, edit, delete, activate/disable/draft, reorder (up/down buttons), change template (with visual preview chooser), change images/text. Admin cannot: write CSS, change fonts/spacing/animation, create templates, design layout.

Section types and v1 templates (fields shown are the full set):
1. **HERO** (`hero-default`): `images[1..8]` (media + alt), `title`, `subtitle?`.
2. **IMAGE_TEXT**: templates `image-text-rect` (rectangular image on plain background) and `image-text-circle` (circular framed image, designed to sit on wood). Fields: `image`+alt, `kicker?`, `title`, `body`, `cta?`, `imagePosition` (visual LEFT | RIGHT), `theme` (GREEN | ORANGE | GOLD, controls title accent and button color).
3. **FULL_IMAGE_OVERLAY** (`overlay-center`): `image`+alt, `kicker?`, `heading`, `body?`, `cta?`, `theme`.
4. **TEXT_GALLERY** (`text-gallery-default`): `kicker?`, `title`, `body`, `cta?`, `images[1..4]` (first is primary; others are secondary with a fixed layout rule per count).
5. **CARD_CAROUSEL** (`carousel-cards`): `title?`, `source` (RECIPES | PRODUCTS | SELECTED), `selectedItems[]` (product/recipe refs, ordered, only for SELECTED), `maxItems` (default 12), `cta?`. Cards are always real entities rendered with the shared card component. **No manual cards.**
6. **CONTENT_GRID** (`grid-default`): `items[]` of `{image?, title, description?, link?}`; column count decided by the design system.

Rules:
- `background=WOOD`: **consecutive WOOD sections merge into one continuous wooden block** (one background, no seam).
- **Template switching**: map fields with the same name; keep non-mapped fields in a hidden `preserved` bucket so switching back restores them. Never lose data silently.
- **Controlled links**: `{type: NONE | HOME | PRODUCTS_PAGE | RECIPES_PAGE | PRODUCT | RECIPE | CATEGORY | CONTACT_PAGE | INTERNAL_PATH, targetId?, path?}`. `INTERNAL_PATH` must start with a single `/` (no scheme, no `//`, no `javascript:`). Links are resolved at render time; a link to a missing/archived/draft target is simply not rendered. No external URLs in v1.
- Editing an ACTIVE section changes the live site after save (cache revalidated). Preview of DRAFT/DISABLED sections is available through the admin preview route.
- Section content schemas are Zod discriminated unions with a `schemaVersion` field to allow future migrations.

### Hero animation (DECIDED, exact)
Images cycle forever. Per image: **ENTER 1.5s** (starts blurred and zoomed, fades in, becomes sharp), **HOLD 5s** fully sharp, **EXIT 1.5s** (blurs and fades out in its last 1.5s while the next image enters at the same moment, so there is never an empty frame). Period per image = 6.5s.
- Zoom direction alternates: **odd images zoom IN** slowly over their lifetime (about 1.00 to 1.10); **even images zoom OUT** (about 1.12 to 1.00). Blur peaks about 10px (about 5px on small screens).
- The very first image on page load appears immediately sharp (no entering blur) to protect LCP. The first image is server-rendered with `fetchpriority="high"`; later images are lazy and the next one is preloaded shortly before its turn.
- One image only: slow zoom, no blur cycle. Pause when the tab is hidden. Reduced motion: simple fade, no zoom/blur. Animate only `transform`, `opacity`, `filter`; keep it smooth on mid-range phones. Timing constants are developer-owned constants, never admin fields.

### Card carousel behavior (DECIDED)
- Auto-advances **one card at a time** every ~4s, **forward only**; after the last card, the first card continues after it (seamless infinite loop; never scroll backward automatically).
- Visible cards: 3 desktop, 2 tablet, 1 mobile (use the prototype breakpoints). **If total cards <= visible cards, autoplay is off** (and arrows hidden).
- Pause on hover/focus/touch; swipe on touch; prev/next arrows on desktop only (manual use may go backward). Reduced motion: no autoplay.
- Must work with any number of cards (no fixed pixel steps). Accessible (`aria-roledescription="carousel"`, labelled slides, no autoplay announcements).

## 8. Data model (DECIDED; adapt Prisma syntax as needed)

Common: `id` (cuid/uuid), `createdAt`, `updatedAt`. Forms use **optimistic concurrency** (compare `updatedAt`/version) because several admins exist; show a Persian conflict message instead of silently overwriting.

- **User** (Better Auth tables + `role` (enum, only `ADMIN` now but keep the column), `isActive`, `lastLoginAt`). Multiple people may have admin accounts, one account per person. Any admin can create/deactivate other admins; nobody can deactivate themselves or the last active admin. First admin is created by a seed/CLI script.
- **Category**: `type` (PRODUCT | RECIPE), `name`, `slug`, `status` (ACTIVE | ARCHIVED), `sortOrder`; unique `(type, slug)`. Flat. No image/description/page. A category with content cannot be deleted, only archived (hidden from navigation/filters; items keep their data). An unused category may be deleted.
- **Product**: `slug` (unique), `nameFa`, `nameOriginal?` (Latin/other script), `status` (DRAFT | PUBLISHED | ARCHIVED), `isAvailable` (موجود/ناموجود), `isFeatured`, `cardTheme` (AUTO | GREEN | ORANGE | YELLOW | BURGUNDY), `sortOrder`, `shortDescription?`, `description?`, `foodNature?` (طبع غذایی), `vitamins?`, `harvestSeason?`, `harvestPlace?`, `color?`, `benefits` (ordered list of strings), `usageWarning?`, `mainImage`, `gallery[]`, `options[]` (**ProductOption**: `label` free text such as "نیم کیلو", `isAvailable`; add/edit/delete by admin; no price or stock in v1), categories (many-to-many, only categories of type PRODUCT). All text fields are free text. Card subtitle falls back to `harvestPlace` when `shortDescription` is empty.
- **Recipe**: `slug`, `nameFa`, `nameOriginal`, `country` (free text, may include a region note), `servingTypes` (set of HOT | WARM | COLD, at least one), `yieldText` (free text, e.g. "۴ تا ۵ فنجان"), `shortDescription?`, `longDescription?` (shown only if present), `status`, `isFeatured`, `cardTheme`, `sortOrder`, `mainImage`, `gallery[]`, categories (many-to-many, type RECIPE only), `ingredients[]`, `steps[]`.
  - **RecipeIngredient**: `name`, `quantityText` (free text such as "۳۰ تا ۴۰", "به مقدار لازم", "½"), `unit?`, `equivalentText?` (e.g. "حدود ۶ قاشق غذا خوری"), `isOptional`, `note?`. Order = insertion order.
  - **RecipeStep**: `text` only. No images, no metadata. Admin can add (appended at the end), edit and delete steps; **admin cannot reorder or insert in the middle**. Display numbers are computed.
  - Serving filter semantics: the HOT toggle matches recipes whose `servingTypes` intersect {HOT, WARM}; the COLD toggle matches those intersecting {COLD, WARM}. Detail page shows one chip per serving type.
- **Card theme AUTO**: deterministic from a stable hash of the slug (not from list position), cycling the four themes.
- **MediaAsset**: `storageKey`, `mime`, `bytes`, `width`, `height`, `blurDataUrl`, `variants` (JSON: widths/paths/format), `alt?`, `createdById`. There is **no media library UI**: images are uploaded inside the form that needs them. The server must never delete a file that is still referenced, and a scheduled job removes unreferenced assets older than 7 days.
- **HomepageSection**: see section 7.
- **SiteSettings** (singleton): cart fields `cartEnabled` (default false), `cartNotice` (default "قیمت و هزینه‌ی ارسال پس از تأیید اعلام می‌شود."), `orderIntroText?`, `orderOutroText?`; plus `siteNameFa`, `siteNameEn?`, `tagline?`, `logo`, `footerLogo?`, `address`, `workingHours`, `latitude`, `longitude`, `mapZoom`, `copyrightText`, default SEO title/description, `ogImage`. (The product file's chat sender is "عسل باباخُرم": use it as a seeded placeholder site name and flag it for client confirmation.)
- **ContactChannel**: `type` (PHONE | WHATSAPP | TELEGRAM | EITAA | RUBIKA | BALE | INSTAGRAM), `value`, `label?`, `isActive`, `sortOrder`, flags for where it shows (contact bar / footer / contact page; default all), `acceptsOrders` (default false; allowed only for PHONE (used for SMS, mobile numbers only), WHATSAPP, TELEGRAM, EITAA, RUBIKA, BALE; never INSTAGRAM).
- **OrderShareLink** (temporary, personal data): unguessable `code`, `payloadEncrypted` (AES-256-GCM, key from env `ORDER_LINK_SECRET`), `channelType`, `expiresAt` (30 minutes), `createdAt`; deleted on expiry (lazy delete plus `pnpm orders:cleanup`), capped in number, excluded from backups and logs.
- **SlugRedirect**: `(entityType, oldSlug) -> entityId`, created automatically when an admin changes a slug; used for 301s.
- **AuditLog**: `userId`, `action`, `entityType`, `entityId`, `summary` (field names changed, no secrets, no full content), `ip`, `userAgent`, `createdAt`. Log logins (success/failure), logouts, all create/update/delete/status changes, user management.
- **Future e-commerce**: keep Product as the content entity. `ProductOption` exists now (label and availability only). Prices, stock, payment, permanent orders and order management will be added later as separate tables referencing Product/ProductOption. Do not add them now.

## 9. Public pages

### Listings (`/products`, `/recipes`)
- Whole-page wooden background, centered title (category name when filtered, otherwise a default title).
- Scoped search box (searches only this entity type), category chips ("همه" + active categories of that type), and, on `/recipes`, the **serving toggle**: two side-by-side buttons "سرد" and "گرم" (exactly one is always selected, selected one is bolder; default `سرد`, URL param `serving=cold|hot`). Below the buttons a line with a centered label "سرو سرد" / "سرو گرم" (centered text with the line on both sides).
- Desktop: 3-column grid of cards. Mobile: one item per row, **image on the visual right, name + short text on the left**.
- Page size 20 with a **"نمایش بیشتر" (Load more)** button using cursor pagination (stable order by `sortOrder, id`). **No page numbers anywhere in the public site.**
- Product cards show an "ناموجود" badge when unavailable (still visible and linkable). Empty state: "موردی یافت نشد".

### Detail pages (shared layout, centered, wooden background)
Top to bottom, all centered: main image; name (large, bold); original/Latin name (smaller, lighter); then a meta area; then content blocks with large bold headings; then gallery (if any); then **related items** (up to 4 published items sharing a category, hidden if none).
- **Recipe**: country, serving chips, yield text; heading "مواد لازم" with the ingredient list (name, quantity, unit, equivalent, optional marker, note); heading "دستور تهیه" with numbered steps.
- **Product**: availability badge, meta chips (طبع غذایی, فصل برداشت, محل برداشت, ویتامین, رنگ; hide empty ones; show text verbatim even if it is a sentence); optional description; heading "خواص" with the benefits list (system draws alternating decorative bullets, the data has none); `usageWarning` in a distinct warning box when present. When the cart is enabled and the product can be ordered, an **option selector, quantity stepper and "افزودن به سبد"** appear (only on the detail page, not on cards); otherwise nothing is shown. No payment or price.
- Persian digits for numbers generated by the UI (step numbers, counts). Stored content is displayed verbatim.

### 9b. Order cart (summary; the addendum is the full spec)

- Cart lives in the visitor's browser (`localStorage`, key `cart:v1`): survives closing the browser, expires 30 days after the last change, no cross-device sync, max 30 lines, quantity 1 to 50. Fresh names/availability are always fetched from the server; storage is never trusted. The cart is not auto-cleared on send; the user confirms "سفارش را ارسال کردید؟".
- `/cart`: lines, `cartNotice`, customer form (first name, last name, Iranian mobile, province, city, address, optional postal code and notes; **delivery only**, no pickup), then a channel chooser listing only active channels with `acceptsOrders`.
- Mobile: SMS plus messengers, opening the app with the order text where that is verified. Desktop: messengers only (no SMS), with open/copy buttons and a **browser-generated QR code per messenger**. The QR encodes only a short URL `SITE_URL/o/<code>` (never the order text or personal data). `/o/<code>` shows the read-only order text with send/copy buttons and expires after 30 minutes. A manual device override is always available.
- A rate-limited server action builds the final order text (full format for messengers, compact format for SMS), re-validating every line, option, product and channel on the server, sanitizing input, and never logging customer data. Deep-link patterns for each channel must be verified against official docs and tested on real devices; unverified ones use "copy text, then open chat".
- Privacy: customer data is not stored by the site; only the encrypted temporary share link (for the QR) holds it for 30 minutes. The cart page states this.

### Contact page
Contact channels, address, working hours, social, and the map (lazy: loads on scroll or tap; static fallback if tiles fail) with **route buttons** that open any navigation app: universal `geo:` link plus verified deep links for Google Maps, Waze, Neshan and Balad (verify each against official docs; drop what you cannot verify). No form, no messaging.

## 10. Search (DECIDED)

- Each searchable row has a `searchText` column maintained by application code on every write (name, original name, country/places, categories, ingredients/benefits as appropriate), built with **Persian normalization**: `ي->ی`, `ك->ک`, Arabic/Persian digits to Latin, remove tatweel/diacritics, ZWNJ to space, collapse spaces, lowercase Latin. The same normalizer is applied to queries. **Stored display content is never normalized.**
- PostgreSQL: GIN indexes (full-text `simple` config and `pg_trgm`) created by raw SQL in migrations. Support partial words.
- Scoped search (listings) is part of the listing query. **Global search** (header drawer + `/search`) returns grouped Products and Recipes (up to 8 each in the drawer, with "see all" links to the scoped listing with `q`). Minimum 2 characters, 250ms debounce, rate-limited, results cached briefly.

## 11. Media pipeline (DECIDED)

- Upload: allow JPEG/PNG/WebP only; validate by magic bytes, not just extension/MIME; max 10 MB; max 6000 px on the long side; auto-rotate, strip EXIF/metadata.
- Produce WebP variants (about 480, 768, 1200, 1920 px wide, never upscale) plus a tiny blur placeholder; store width/height in the DB. Render with a custom `<Picture>` (srcset/sizes, explicit width/height to avoid layout shift, `loading="lazy"` except the LCP image). Serve files as static assets with long immutable cache headers.
- Storage behind an interface (`StorageProvider`): local disk now (mounted volume, served by the reverse proxy), S3-compatible later without code changes elsewhere. Filenames are random; never trust the original name.
- Admin upload widgets: drag/drop or pick, progress, replace, remove, alt text input.

## 12. Security (first-class requirement)

- Server-side authorization on every admin read/write; a central `requireAdmin()`; tests proving unauthenticated and deactivated users are rejected.
- Rate limit login, public search/load-more, cart lookup, order building and share-link creation (reverse proxy `limit_req` plus an in-app limiter; no Redis). Generic login errors, no user enumeration, lockout/backoff after repeated failures.
- CSRF protection (framework origin checks for server actions; verify for route handlers), strict input validation, output escaping (no `dangerouslySetInnerHTML` with user content), safe link handling (see controlled links), upload hardening (section 11).
- Security headers: CSP (choose an approach compatible with caching, avoid per-request nonces on cached public pages, and report the trade-off), HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, frame protections.
- Secrets only in env, validated at boot (Zod). No secrets in the repo or logs. Admin area `noindex`.
- Audit log for sensitive operations.

## 13. SEO

`generateMetadata` for every page; canonical URLs from `SITE_URL`; Open Graph/Twitter from the main image; dynamic `sitemap.xml` and `robots.txt` (admin, cart, `/o/` and search disallowed); JSON-LD: `Organization` + `WebSite` on home, `Recipe` (name, image, recipeIngredient, recipeInstructions as HowToStep, recipeYield, recipeCuisine from country, recipeCategory) on recipe pages, `Product` (no offers) on product pages; `lang="fa" dir="rtl"`; 301 via `SlugRedirect`.

## 14. Performance and accessibility targets

- Expected load: about 50 concurrent users; design target 100. With caching this is small; a 2 vCPU / 4 GB VPS must be comfortable.
- Mobile Lighthouse on a production build: Performance >= 90, Accessibility >= 95, SEO >= 95, Best Practices >= 95. LCP < 2.5s on a throttled mobile profile. CLS < 0.05.
- Minimal client JS; no layout shift; lazy-load below-the-fold images; self-hosted font with `font-display: swap` and preload for the main weights.
- Accessibility: semantic landmarks, skip link, visible focus, keyboard-operable menus/carousel/drawers, labelled controls, sufficient contrast (verify yellow card text), reduced-motion support.

## 15. Deployment and operations (DECIDED)

Docker Compose (app, postgres, reverse proxy), `output: standalone`, `/healthz`, env-driven config (including `ORDER_LINK_SECRET`), a scheduled `orders:cleanup` job, backups that exclude the `OrderShareLink` table data, daily `pg_dump` + uploads backup with retention (7 daily + 4 weekly) and a **tested restore procedure**, log rotation, Nginx/Caddy gzip/brotli + immutable caching for `/uploads` + `limit_req`, HTTPS, Uptime Kuma (separate container) for uptime alerts, a runbook in `docs/`.

## 16. Source data and import rules (LOCKED)

Imported products start **without order options** (the admin adds them later). Files: `data/source/products.txt` (31 products, a Telegram chat export) and `data/source/recipes.txt` (37 recipes). The client's text is authoritative: **import verbatim and do not fix spelling, typos, digits or wording**, even if it looks wrong. Only these transformations are allowed: dropping chat metadata lines (`[date time] sender: [ Photo ]`), dropping decorative leading bullets (🔸 🔹) and the ❌ marker with its enclosing parentheses on warnings (store the inner text in `usageWarning`), trimming surrounding whitespace, and splitting into fields.

- **Product parsing**: first non-empty line after the photo line = `nameFa`; next line = `nameOriginal`; then labeled lines `طبع غذایی`, `ویتامین`, `فصل برداشت`, `محل برداشت`, `رنگ` (may be empty -> null); then `خواص:` followed by one benefit per line until the next product (a benefit line may lack a bullet). Images are not in the file: import without images.
- **Recipe parsing**: block = title line, then `نام اصلی:`, `کشور نوشیدنی:` (keep the whole text incl. parentheses), `نوع سرو:`; `مواد لازم (X)` -> `yieldText = X` verbatim; ingredient lines `name: rest` split at the first colon; `rest` is split into `quantityText`, `unit` (only when it ends with a clearly known unit word), `equivalentText` (parenthesized text containing a measure), `isOptional` (the word اختیاری) and `note` (other parenthesized text). **Add a test that re-joining the parsed parts reproduces the original text apart from whitespace/punctuation placement**; log every low-confidence line in the import report. Steps: `دستور تهیه` lines with an `N:` prefix (prefix removed); an unnumbered line is still a step.
- **Serving mapping**: `گرم` -> {HOT}; `سرد` -> {COLD}; `گرم یا سرد` and `سرد یا گرم` -> {HOT, COLD}; `سرد یا ولرم` -> {COLD, WARM}; anything else -> report.
- **Slugs**: slugified from `nameOriginal`; Latin only; de-duplicate with `-2`, `-3`.
- **Categories** (DEFAULT, editable later in the admin):
  - Product categories: «انواع عسل» (`honey-types`, the 29 honeys) and «فرآورده‌های دیگر زنبور» (`other-bee-products`: گرده گل, رویال ژل).
  - Recipe categories: «چای و دمنوش‌ها» (`teas-infusions`), «شربت‌ها و نوشیدنی‌های میوه‌ای» (`sharbat-fruit-drinks`), «نوشیدنی‌های شیری» (`milk-drinks`), «نوشیدنی‌های غلات و دانه‌ها» (`grain-seed-drinks`). Assign by reading ingredients with these rules: milk as the main liquid -> milk-drinks; flour/powder of grain, seed or cereal as the base -> grain-seed-drinks; fruit, citrus, fruit puree/concentrate or vinegar-syrup as the main character -> sharbat-fruit-drinks; leaves/herbs/flowers/spices steeped or boiled in water -> teas-infusions. A recipe may have several categories; every recipe has at least one. **Output the full assignment table in the report for the supervisor to approve.**
- **Status**: import as DRAFT (no images yet). A `--publish` flag exists for local development only.
- Print an import report: counts, low-confidence lines, slug collisions, assignment table.

## 17. Out of scope for v1

Payment gateway, prices and totals, stock counts, shipping calculation, order history or order management in the admin, permanent storage of orders or customer data, in-person pickup option; user accounts; comments/ratings; blog; newsletter; email sending; analytics; multilingual UI; media library; admin-defined pages/templates/CSS; drag-and-drop reordering of recipe steps; external-URL links; revision history/versioned drafts of already-published content (v2 candidate).

## 18. Standard report format (end of every phase)

Reply with exactly these headings:
1. **Summary**: what was built, in plain language.
2. **How to run and verify**: commands and URLs; credentials for dev only.
3. **Files and structure**: key files added/changed.
4. **Acceptance checklist**: each criterion of the phase marked PASS/FAIL with evidence (test names, command output, screenshots described).
5. **Decisions I made**: every choice not dictated by the brief, with reasons.
6. **Deviations from the brief**: must be empty, otherwise justify.
7. **Versions**: exact versions of Next.js, React, Prisma, Better Auth, Tailwind, shadcn/ui, Node, PostgreSQL.
8. **Known issues and risks**.
9. **Questions for the supervisor**.
Also update `docs/PROGRESS.md` (phase status, decisions, open items). Do not start the next phase.
