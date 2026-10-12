# Architecture & System Design

> High-level architectural overview of the Persian Honey Brand (عسل باباخُرم) Website and CMS.

---

## 1. Folder Structure

```
├── prisma/                    # Prisma schema, migrations, and seed scripts
├── public/
│   └── fonts/                 # Self-hosted Vazirmatn variable font (WOFF2)
├── src/
│   ├── app/
│   │   ├── (public)/          # Public routes (Home, Products, Recipes, Contact, Cart, /o/[code])
│   │   ├── admin/             # Custom CMS Admin routes (Dashboard, Sections, Products, Settings, Audit)
│   │   ├── layout.tsx         # Root layout with lang="fa", dir="rtl", and Vazirmatn font
│   │   ├── page.tsx           # Foundation demo page (temporary)
│   │   └── globals.css        # Tailwind directives, CSS variables, and design tokens
│   ├── components/
│   │   ├── ui/                # Base reusable primitives (shadcn/ui, PillButton)
│   │   ├── public/            # Public-facing components (Hero, Carousel, Cards, Drawers)
│   │   └── admin/             # Admin CMS UI components (Section editors, media uploaders)
│   ├── content/
│   │   └── ui-strings.fa.ts   # Single source of truth for all Persian UI text (no i18n library)
│   ├── lib/
│   │   ├── env.ts             # Zod fail-fast environment validation
│   │   └── utils.ts           # Class merging (cn) and shared helpers
│   └── server/
│       ├── db/                # Prisma client singleton
│       ├── auth/              # Better Auth configuration and requireAdmin() guard
│       ├── queries/           # Data Access Layer (DAL) with tagged, cached queries
│       ├── actions/           # Next.js Server Actions with Zod validation and audit logging
│       ├── services/          # Domain services (Order builder, text normalizer)
│       ├── storage/           # Sharp media pipeline and StorageProvider interface
│       └── search/            # PostgreSQL FTS and trigram query builders
├── tests/
│   ├── unit/                  # Vitest unit tests (env, normalizer, utilities)
│   └── e2e/                   # Playwright E2E smoke and regression tests (desktop & mobile)
├── docs/                      # Architectural specifications and progress tracking
├── data/source/               # Authoritative client raw content (products.txt, recipes.txt)
└── reference/                 # Read-only static prototype (visual guide only; excluded from build)
```

---

## 2. Rendering Strategy

- **Server Components by Default**: All public pages (`/`, `/products`, `/recipes`, `/contact`) are React Server Components (RSC) rendered on the server.
- **Client Islands**: Client-side JavaScript is restricted strictly to interactive elements:
  - Hero cinematic alternating zoom animation
  - Card carousel touch swipe and auto-advance loop
  - Hamburger drawer and search drawer
  - Order cart state and customer checkout form
  - Leaflet map lazy loader
- **Caching & Revalidation**: Next.js Data Cache is utilized with explicit cache tags (`homepage`, `products`, `recipes`, `categories`, `settings`). Public pages serve static responses to visitors and update immediately when an admin saves changes via `revalidateTag()`.

---

## 3. Data Flow

### A. Public Data Retrieval
```
PostgreSQL Database
       │
       ▼
Server Queries (src/server/queries/*) [Tagged & Cached]
       │
       ▼
React Server Component (Page / Layout)
       │
       ▼
HTML Stream with lang="fa" & dir="rtl" to Client Browser
```

### B. Order Cart Flow (Zero Database Persistence)
```
1. Visitor adds items to cart -> Saved locally in browser (localStorage: "cart:v1")
2. Visitor navigates to /cart -> Client fetches fresh availability by IDs from rate-limited endpoint
3. Visitor fills customer form & selects channel (SMS / WhatsApp / Telegram / Eitaa / Bale / Rubika)
4. Client calls Server Action: buildOrder(cartLines, customer, channelType)
   ├── Server validates all items, options, availability, and customer fields via Zod
   ├── Server formats message text (intro + numbered items + customer details + outro)
   ├── Server creates temporary OrderShareLink (AES-256-GCM encrypted, 30 min expiry) for QR
   └── Server returns clean deep-links & share URL
5. Desktop displays browser-generated QR code (encoding short URL SITE_URL/o/<code>); Mobile opens app
6. Business receives message via messenger/SMS; Site stores NO order or customer records permanently
```

### C. Admin Mutation Pipeline
```
Admin Action in Browser
       │
       ▼
Next.js Server Action
       │
       ├─► 1. Zod Input Validation
       ├─► 2. Server-side Authentication & requireAdmin() Authorization
       ├─► 3. Prisma Database Transaction
       ├─► 4. AuditLog Record Creation (User, Action, Entity, Timestamp)
       └─► 5. Tag Revalidation (revalidateTag / revalidatePath)
```
