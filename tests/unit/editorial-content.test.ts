import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import productsSeed from '../../data/seed/products.json';
import recipesSeed from '../../data/seed/recipes.json';
import { FAQ_ENTRIES } from '@/content/faq-data';
import {
  HONEY_TEMPERAMENT_ITEMS,
  MAGAZINE_ARTICLES,
  getMagazineArticleBySlug,
} from '@/content/magazine-articles';
import {
  FAQ_DROPDOWN_ITEMS,
  MAGAZINE_DROPDOWN_ITEMS,
  MONOFLORAL_HONEY_LINKS,
  PRODUCT_DROPDOWN_ITEMS,
} from '@/content/navigation-menu';
import { mockDb } from '@/server/db/mock-client';
import sitemap from '@/app/sitemap';

const ROOT = process.cwd();

describe('Editorial Content & Imported Breakfast Recipes', () => {
  it('resolves breakfast and cakes-pastries recipe categories properly in mockDb', async () => {
    const breakfast = await mockDb.recipe.findMany({
      where: {
        status: 'PUBLISHED',
        categories: { some: { category: { slug: 'breakfast' } } },
      },
    });
    expect(breakfast.length).toBe(22);

    const pastries = await mockDb.recipe.findMany({
      where: {
        status: 'PUBLISHED',
        categories: { some: { category: { slug: 'cakes-pastries' } } },
      },
    });
    expect(pastries.length).toBe(10);
  });

  it('stores all 22 new breakfast recipes with valid WebP images on disk', () => {
    const breakfastSeed = recipesSeed.filter((r) =>
      (r.categoryIds || []).includes('cat_breakfast')
    );
    expect(breakfastSeed.length).toBe(22);

    for (const rcp of breakfastSeed) {
      expect(rcp.status).toBe('PUBLISHED');
      expect(rcp.ingredients.length).toBeGreaterThanOrEqual(3);
      expect(rcp.steps.length).toBeGreaterThanOrEqual(4);
      expect(rcp.imageUrl).toMatch(/^\/uploads\/recipes\/breakfast-.*\.webp$/);
      const diskPath = path.join(ROOT, 'public', rcp.imageUrl);
      expect(fs.existsSync(diskPath)).toBe(true);
    }
  });

  it('links all 27 monofloral nav items and 29 temperament items to real product slugs', () => {
    const validProductSlugs = new Set(productsSeed.map((p) => p.slug));

    expect(MONOFLORAL_HONEY_LINKS.length).toBe(27);
    for (const link of MONOFLORAL_HONEY_LINKS) {
      const slug = link.href.replace('/products/', '');
      expect(validProductSlugs.has(slug)).toBe(true);
    }

    expect(HONEY_TEMPERAMENT_ITEMS.length).toBe(29);
    for (const item of HONEY_TEMPERAMENT_ITEMS) {
      expect(validProductSlugs.has(item.productSlug)).toBe(true);
    }

    expect(PRODUCT_DROPDOWN_ITEMS.length).toBe(5);
    expect(MAGAZINE_DROPDOWN_ITEMS.length).toBe(7);
    expect(FAQ_DROPDOWN_ITEMS.length).toBe(4);
  });

  it('provides 7 complete scientific magazine articles with valid cover images', () => {
    expect(MAGAZINE_ARTICLES.length).toBe(7);
    const seenSlugs = new Set<string>();

    for (const article of MAGAZINE_ARTICLES) {
      expect(seenSlugs.has(article.slug)).toBe(false);
      seenSlugs.add(article.slug);
      expect(getMagazineArticleBySlug(article.slug)?.title).toBe(article.title);
      expect(article.sections.length).toBeGreaterThanOrEqual(3);

      const diskPath = path.join(ROOT, 'public', article.imageUrl);
      expect(fs.existsSync(diskPath)).toBe(true);
    }
  });

  it('provides unique FAQ anchor IDs matching nav deep links and valid blocks', () => {
    const ids = new Set(FAQ_ENTRIES.map((e) => e.id));
    expect(ids.size).toBe(FAQ_ENTRIES.length);
    expect(FAQ_ENTRIES.length).toBeGreaterThanOrEqual(10);

    for (const navFaq of FAQ_DROPDOWN_ITEMS) {
      const hashId = navFaq.href.split('#')[1];
      expect(ids.has(hashId)).toBe(true);
    }
  });

  it('includes /magazine, /faq, and article slugs in sitemap output', async () => {
    const entries = await sitemap();
    const urls = new Set(entries.map((e) => e.url));

    expect(Array.from(urls).some((u) => u.endsWith('/magazine'))).toBe(true);
    expect(Array.from(urls).some((u) => u.endsWith('/faq'))).toBe(true);
    for (const article of MAGAZINE_ARTICLES) {
      expect(Array.from(urls).some((u) => u.endsWith(`/magazine/${article.slug}`))).toBe(true);
    }
  });
});
