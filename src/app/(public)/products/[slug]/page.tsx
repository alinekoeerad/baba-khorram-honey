/**
 * Product Detail Page (Phase 8 Task 5 & Task 7)
 * URL: /products/[slug]
 *
 * Requirements:
 * - Shared centered layout on wooden background (ProductDetailView)
 * - 404 for DRAFT/ARCHIVED or non-existent items
 * - 301 permanent redirect for old slugs via SlugRedirect
 * - generateMetadata with canonical URL and Open Graph
 * - JSON-LD schema.org/Product (without offers per Brief Section 13)
 * - AddToCartSlot placeholder component
 */

import React from 'react';
import { db } from '@/server/db/client';

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const products = await db.product.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true },
    });
    return (products || []).map((p: any) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getPublicProductBySlug } from '@/server/queries/products';
import { getPublicSiteSettings } from '@/server/queries/settings';
import { ProductDetailView } from '@/components/public/product-detail-view';

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { product, redirect } = await getPublicProductBySlug(slug);

  if (redirect) {
    return {
      title: 'انتقال نشانی | عسل باباخُرم',
    };
  }

  if (!product) {
    return {
      title: 'محصول یافت نشد | عسل باباخُرم',
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://babakhorram.com';
  const canonicalUrl = `${siteUrl}/products/${product.slug}`;
  const description =
    product.shortDescription ||
    product.description ||
    `خرید مستقیم و بررسی خواص ${product.nameFa} با تضمین اصالت و برگه آزمایشگاهی`;

  const mainImageUrl = product.mainImage
    ? `${siteUrl}/uploads/${product.mainImage.storageKey}`
    : undefined;

  return {
    title: `${product.nameFa} | عسل باباخُرم`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${product.nameFa} | عسل باباخُرم`,
      description,
      url: canonicalUrl,
      locale: 'fa_IR',
      siteName: 'عسل باباخُرم',
      images: mainImageUrl ? [{ url: mainImageUrl, alt: product.nameFa }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.nameFa} | عسل باباخُرم`,
      description,
      images: mainImageUrl ? [mainImageUrl] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const { product, relatedProducts, redirect } = await getPublicProductBySlug(slug);
  const settings = await getPublicSiteSettings();

  // 1. Handle 301 Permanent Redirect
  if (redirect) {
    permanentRedirect(redirect.destination);
  }

  // 2. Handle 404 for Draft/Archived/Missing
  if (!product) {
    notFound();
  }

  // 3. Build JSON-LD (schema.org/Product without offers per Brief Section 13)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://babakhorram.com';
  const mainImageUrl = product.mainImage
    ? `${siteUrl}/uploads/${product.mainImage.storageKey}`
    : undefined;

  const categoryNames = product.categories
    .map((c: any) => c.category?.name)
    .filter(Boolean);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.nameFa,
    image: mainImageUrl,
    description: product.shortDescription || product.description || undefined,
    sku: product.slug,
    category: categoryNames.length > 0 ? categoryNames.join(', ') : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailView product={product} relatedProducts={relatedProducts} cartEnabled={settings.cartEnabled} />
    </>
  );
}
