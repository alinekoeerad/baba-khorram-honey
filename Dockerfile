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
FROM deps AS builder
COPY . .

# Environment variables for build phase
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV SITE_URL="https://babakhorram.com"
ENV ORDER_LINK_SECRET="build-phase-temporary-secret-32-chars-long!"
ENV BETTER_AUTH_SECRET="build-phase-temporary-secret-32-chars-long!"
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/honey_build?schema=public"
ENV USE_MOCK_DB="true"

RUN pnpm build

# ---------------------------------------------------------------
# Stage 4: Production Runtime Runner
# ---------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl
RUN npm install -g prisma@7.0.0 @prisma/adapter-pg pg

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_PATH="/usr/local/lib/node_modules:/app/node_modules"

# Create non-root system user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create uploads directory and set permissions
RUN mkdir -p /app/uploads && chown -R nextjs:nodejs /app/uploads

# Copy public assets & static chunks
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Link global prisma and adapters to local node_modules so scripts, client, and config are resolvable
RUN mkdir -p /app/node_modules/@prisma && \
    ln -sf "$(npm root -g)/prisma" /app/node_modules/prisma && \
    ln -sf "$(npm root -g)/@prisma/adapter-pg" /app/node_modules/@prisma/adapter-pg && \
    ln -sf "$(npm root -g)/pg" /app/node_modules/pg || true

# Copy prisma migration scripts, schema, seed data, and scripts
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/data ./data
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000

VOLUME ["/app/uploads"]

ENTRYPOINT ["./docker-entrypoint.sh"]

