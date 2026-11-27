export const dynamic = 'force-dynamic';

import type { MetadataRoute } from 'next';
import { db } from '@/server/db/client';
import { MAGAZINE_ARTICLES } from '@/content/magazine-articles';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://babakhorram.com';

  let products: any[] = [];
  let recipes: any[] = [];
  let magazineArticles: any[] = [];

  try {
    const [prods, recs, mags] = await Promise.all([
      db.product.findMany({
        where: { status: 'PUBLISHED' },
        select: { slug: true, updatedAt: true },
        take: 5000,
      }),
      db.recipe.findMany({
        where: { status: 'PUBLISHED' },
        select: { slug: true, updatedAt: true },
        take: 5000,
      }),
      db.magazineArticle.findMany({
        where: { status: 'PUBLISHED' },
        select: { slug: true, updatedAt: true },
        take: 1000,
      }),
    ]);
    products = prods || [];
    recipes = recs || [];
    magazineArticles = mags || [];
  } catch {
    products = [];
    recipes = [];
    magazineArticles = [];
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/recipes`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/magazine`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${siteUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/feedback`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  const magazineRoutes: MetadataRoute.Sitemap =
    magazineArticles.length > 0
      ? magazineArticles.map((article: any) => ({
          url: `${siteUrl}/magazine/${article.slug}`,
          lastModified: new Date(article.updatedAt || new Date()),
          changeFrequency: 'monthly' as const,
          priority: 0.75,
        }))
      : MAGAZINE_ARTICLES.map((article) => ({
          url: `${siteUrl}/magazine/${article.slug}`,
          lastModified: new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.75,
        }));

  const productRoutes: MetadataRoute.Sitemap = products.map((p: any) => ({
    url: `${siteUrl}/products/${p.slug}`,
    lastModified: new Date(p.updatedAt || p.createdAt || new Date()),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const recipeRoutes: MetadataRoute.Sitemap = recipes.map((r: any) => ({
    url: `${siteUrl}/recipes/${r.slug}`,
    lastModified: new Date(r.updatedAt || r.createdAt || new Date()),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...magazineRoutes, ...productRoutes, ...recipeRoutes];
}
