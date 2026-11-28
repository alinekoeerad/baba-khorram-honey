#!/bin/sh
set -e

# Export NODE_PATH so global prisma modules (like 'prisma/config') can be resolved
export NODE_PATH="$(npm root -g):/app/node_modules:${NODE_PATH:-}"

echo "==============================================================="
echo "🍯 Persian Honey Website — Production Container Boot"
echo "==============================================================="

# 1. Wait for PostgreSQL and synchronize database schema
echo "📡 Synchronizing PostgreSQL schema with Prisma (prisma db push)..."
MAX_RETRIES=15
COUNT=0

until prisma db push; do
  COUNT=$((COUNT+1))
  if [ $COUNT -ge $MAX_RETRIES ]; then
    echo "❌ [ERROR] Could not connect to PostgreSQL after $MAX_RETRIES attempts. Exiting."
    exit 1
  fi
  echo "⏳ PostgreSQL not ready yet. Retrying in 2 seconds ($COUNT/$MAX_RETRIES)..."
  sleep 2
done

echo "✅ Database schema synchronized successfully."

# 2. Run idempotent database seeding
echo "🌱 Running idempotent database seed (Users, Products, Recipes, FAQs, Magazine, Settings)..."
node scripts/seed-db.mjs

# 3. Synchronize initial seed uploads to persistent volume if mounted
if [ -d "/app/public/uploads" ] && [ -d "/app/uploads" ]; then
  echo "📁 Synchronizing seeded uploads into persistent volume..."
  cp -rn /app/public/uploads/* /app/uploads/ 2>/dev/null || true
fi

echo "🚀 Starting Next.js application server on port ${PORT:-3000}..."
exec node server.js
