#!/usr/bin/env node

/**
 * Expired Order Share Links Cleanup Script (Phase 9 Task 8 & Addendum A2)
 * Command: pnpm orders:cleanup
 * Deletes all OrderShareLink rows where expiresAt < now.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const deleted = await prisma.orderShareLink.deleteMany({
    where: {
      expiresAt: {
        lt: now,
      },
    },
  });

  console.log(`[Order Cleanup] Deleted ${deleted.count} expired order share links at ${now.toISOString()}.`);
}

main()
  .catch((e) => {
    console.error('[Order Cleanup Error]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
