/**
 * Public Category Queries (Phase 4 & Phase 5, Task A)
 * Strictly returns ACTIVE categories.
 */

import { db } from '@/server/db/client';

export async function getPublicCategories(type: 'PRODUCT' | 'RECIPE') {
  return await db.category.findMany({
    where: {
      type,
      status: 'ACTIVE',
    },
    orderBy: { sortOrder: 'asc' },
  });
}

// Alias for backwards compatibility
export const getActiveCategoriesByType = getPublicCategories;
