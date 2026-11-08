# ===============================================================
# Multi-stage Production Dockerfile for Persian Honey Website
# Framework: Next.js 16 (Standalone Output) + Node.js 22 LTS
# ===============================================================

# ---------------------------------------------------------------
# Stage 1: Base Alpine Image with Native Dependencies
# ---------------------------------------------------------------
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@10.6.2 --activate

# ---------------------------------------------------------------
# Stage 2: Install Dependencies
# ---------------------------------------------------------------
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies required for Next.js build)
RUN pnpm install --frozen-lockfile

# Generate Prisma Client for Linux Alpine engine
RUN pnpm prisma generate

# ---------------------------------------------------------------
# Stage 3: Build the Next.js Application
# ---------------------------------------------------------------
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps /app/node_modules/@prisma ./node_modules/@prisma
COPY . .

# Environment variables for build phase
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV SITE_URL="https://babakhorram.com"
ENV ORDER_LINK_SECRET="build-phase-temporary-secret-32-chars-long!"
ENV BETTER_AUTH_SECRET="build-phase-temporary-secret-32-chars-long!"
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/honey_build?schema=public"

RUN pnpm build

# ---------------------------------------------------------------
# Stage 4: Production Runtime Runner
# ---------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root system user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create uploads directory and set permissions
RUN mkdir -p /app/uploads && chown -R nextjs:nodejs /app/uploads

# Copy public assets & static chunks
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy prisma migration scripts & schema for deployment migration commands
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts

USER nextjs

EXPOSE 3000

VOLUME ["/app/uploads"]

CMD ["node", "server.js"]

