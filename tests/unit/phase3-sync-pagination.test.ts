import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPublicProducts } from '@/server/queries/products';
import { getPublicRecipes } from '@/server/queries/recipes';
import { ProductService } from '@/server/services/product-service';
import { RecipeService } from '@/server/services/recipe-service';
import { mockDb } from '@/server/db/mock-client';
import { db } from '@/server/db/client';

describe('Phase 3 Search, Pagination & DB Sync Fixes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('uses searchText (not searchQuery) in ProductService.listProducts and RecipeService.listRecipes', async () => {
    const pSpy = vi.spyOn(db.product, 'findMany').mockResolvedValueOnce([]);
    vi.spyOn(db.product, 'count').mockResolvedValueOnce(0);

    await ProductService.listProducts({ search: 'آويشن' });
    const pWhere = (pSpy.mock.calls[0][0] as any).where;
    expect(pWhere.searchQuery).toBeUndefined();
    expect(pWhere.searchText?.contains).toBe('اویشن');

    const rSpy = vi.spyOn(db.recipe, 'findMany').mockResolvedValueOnce([]);
    vi.spyOn(db.recipe, 'count').mockResolvedValueOnce(0);

    await RecipeService.listRecipes({ search: 'بغرير' });
    const rWhere = (rSpy.mock.calls[0][0] as any).where;
    expect(rWhere.searchQuery).toBeUndefined();
    expect(rWhere.searchText?.contains).toBe('بغریر'.replace(/ي/g, 'ی'));
  });

  it('omits skip when cursor is provided in getPublicProducts and getPublicRecipes', async () => {
    const pSpy = vi.spyOn(db.product, 'findMany').mockResolvedValueOnce([]);
    await getPublicProducts({
      cursor: { sortOrder: 5, id: 'prd_5' },
      skip: 20,
      take: 12,
    });
    expect((pSpy.mock.calls[0][0] as any).skip).toBeUndefined();

    const rSpy = vi.spyOn(db.recipe, 'findMany').mockResolvedValueOnce([]);
    await getPublicRecipes({
      cursor: { sortOrder: 5, id: 'rcp_5' },
      skip: 20,
      take: 12,
    });
    expect((rSpy.mock.calls[0][0] as any).skip).toBeUndefined();
  });

  it('handles cursor tie-breaker when multiple mockDb items share the same sortOrder', async () => {
    const allPublished = await mockDb.product.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    expect(allPublished.length).toBeGreaterThan(2);

    const first = allPublished[0];
    const page2 = await mockDb.product.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { sortOrder: { gt: first.sortOrder } },
          { sortOrder: first.sortOrder, id: { gt: first.id } },
        ],
      },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      take: 5,
    });

    expect(page2.length).toBe(5);
    expect(page2[0].id).toBe(allPublished[1].id);
  });
});
