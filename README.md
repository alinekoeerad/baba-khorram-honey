# Persian Honey Project - Foundation & CMS

A production-grade Persian (RTL) website and custom CMS, built with Next.js 16 (App Router), React 19, TypeScript 7, Tailwind CSS v4, and PostgreSQL.

---

## 🍯 Tech Stack & Foundation

- **Framework**: Next.js 16.4.0 (App Router, Server Components by default)
- **Runtime Target**: Node.js >= 22.12.0 (Node 24 LTS specified in `.nvmrc` and `engines`)
- **Language**: TypeScript 7.0.2 (`strict: true`)
- **Styling**: Tailwind CSS 4.3.3 using `@theme` and CSS Logical Properties (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `start-`, `end-`)
- **UI System**: shadcn/ui with RTL configuration and amber/honey theme
- **Typography**: Self-hosted official Vazirmatn Variable Font (`Vazirmatn[wght].woff2`, v33.003, SIL OFL 1.1), zero external font/CDN runtime requests
- **Database**: PostgreSQL 16 (via Docker Compose in local development, neutral db name: `honey_dev`)
- **Validation**: Zod 4.6.5 (fail-fast environment and mutation schemas)
- **Testing**: Vitest 5.0.3 (Unit tests) & Playwright 1.64.0 (E2E smoke tests for Desktop Chrome, Mobile Chrome, Mobile Safari)
- **Package Manager**: pnpm 9.15.0

---

## 🚀 Quick Start & Setup

### 1. Prerequisites
- **Node.js**: v24 LTS (minimum v22.12.0)
- **pnpm**: v9.0.0+
- **Docker**: For running local PostgreSQL development database

### 2. Environment Configuration
Copy `.env.example` to create your local `.env.local` configuration:
```bash
cp .env.example .env.local
```
Key variables validated at boot:
- `DATABASE_URL`: PostgreSQL connection string (default: `postgresql://postgres:postgres@localhost:5432/honey_dev?schema=public`)
- `SITE_URL`: Base canonical URL (e.g. `http://localhost:3000`)
- `UPLOAD_DIR`: Local media directory (`./uploads`)
- `ORDER_LINK_SECRET`: 32-character AES-256-GCM encryption key

### 3. Start Local PostgreSQL Database
Run the development database container with automated healthcheck:
```bash
docker compose -f docker-compose.dev.yml up -d
```

### 4. Install Dependencies
```bash
pnpm install --frozen-lockfile
```

### 5. Start Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the temporary foundation demo page.

---

## 🛠 Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Starts local Next.js development server on `http://localhost:3000` |
| `pnpm build` | Compiles production-ready standalone build |
| `pnpm start` | Runs the compiled production build |
| `pnpm lint` | Runs ESLint analysis across `src/` and `tests/` (excluding `/reference` and `/data`) |
| `pnpm typecheck` | Executes strict TypeScript compiler verification (`tsc --noEmit`) |
| `pnpm test` | Runs Vitest unit tests |
| `pnpm check` | Runs full quality gate: `typecheck && lint && test && build` (fails fast) |
| `pnpm test:db` | Runs database-integrated tests against dedicated `honey_test` database |
| `pnpm db:test:setup` | Prepares and migrates the separate `honey_test` database |
| `pnpm test:e2e` | Runs Playwright E2E tests (Desktop Chrome, Mobile Chrome, Mobile Safari) |
| `pnpm exec playwright install` | Installs browser binaries for Playwright E2E testing |

---

## 📁 Repository Structure

```
├── prisma/                    # Database schema and seed migrations (Phase 1)
├── public/fonts/              # Official Vazirmatn variable font and OFL.txt license
├── src/
│   ├── app/                   # Next.js App Router (public and admin layouts)
│   ├── components/            # UI primitives (PillButton, Cards) and domain components
│   ├── content/               # Centralized Persian strings (ui-strings.fa.ts)
│   ├── lib/                   # Utility functions and Zod env validator
│   └── server/                # Server-only modules (db, auth, queries, actions, services, storage, search)
├── tests/
│   ├── unit/                  # Vitest unit test suite
│   └── e2e/                   # Playwright end-to-end smoke test suite
├── docs/                      # Progress roadmap, architecture, and project briefs
├── data/source/               # Authoritative raw content data (excluded from build)
└── reference/                 # Read-only visual prototype (strictly excluded from builds)
```

---

## 📄 License & Notes

- Vazirmatn font is licensed under the SIL Open Font License, Version 1.1 (`public/fonts/OFL.txt`).
- All Persian user-facing text resides in `src/content/ui-strings.fa.ts`.
- The prototype folder `/reference` is a visual reference only and is strictly excluded from all builds, typechecking, and linting.
