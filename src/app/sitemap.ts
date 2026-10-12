import type { MetadataRoute } from 'next';
import { db } from '@/server/db/client';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://babakhorram.com';

  let products: any[] = [];
  let recipes: any[] = [];

  try {
    const [prods, recs] = await Promise.all([
      db.product.findMany({ where: { status: 'PUBLISHED' } }),
      db.recipe.findMany({ where: { status: 'PUBLISHED' } }),
    ]);
    products = prods || [];
    recipes = recs || [];
  } catch {
    products = [];
    recipes = [];
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

  return [...staticRoutes, ...productRoutes, ...recipeRoutes];
}
