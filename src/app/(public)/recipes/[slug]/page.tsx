/**
 * Recipe Detail Page (Phase 8 Task 5 & Task 7)
 * URL: /recipes/[slug]
 *
 * Requirements:
 * - Shared centered layout on wooden background (RecipeDetailView)
 * - 404 for DRAFT/ARCHIVED or non-existent items
 * - 301 permanent redirect for old slugs via SlugRedirect
 * - generateMetadata with canonical URL and Open Graph
 * - JSON-LD schema.org/Recipe (name, image, recipeIngredient, recipeInstructions as HowToStep, recipeYield, recipeCuisine, recipeCategory)
 */

import React from 'react';
import { db } from '@/server/db/client';

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const recipes = await db.recipe.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true },
    });
    return (recipes || []).map((r: any) => ({ slug: r.slug }));
  } catch {
    return [];
  }
}

import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getPublicRecipeBySlug } from '@/server/queries/recipes';
import { RecipeDetailView } from '@/components/public/recipe-detail-view';

interface RecipePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: RecipePageProps): Promise<Metadata> {
  const { slug } = await params;
  const { recipe, redirect } = await getPublicRecipeBySlug(slug);

  if (redirect) {
    return {
      title: 'انتقال نشانی | عسل باباخُرم',
    };
  }

  if (!recipe) {
    return {
      title: 'دستور تهیه یافت نشد | عسل باباخُرم',
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://babakhorram.com';
  const canonicalUrl = `${siteUrl}/recipes/${recipe.slug}`;
  const description =
    recipe.shortDescription ||
    recipe.longDescription ||
    `طرز تهیه و دستور پخت اصیل ${recipe.nameFa} با عسل طبیعی باباخُرم`;

  const mainImageUrl = recipe.mainImage
    ? `${siteUrl}/uploads/${recipe.mainImage.storageKey}`
    : undefined;

  return {
    title: `${recipe.nameFa} | عسل باباخُرم`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${recipe.nameFa} | عسل باباخُرم`,
      description,
      url: canonicalUrl,
      locale: 'fa_IR',
      siteName: 'عسل باباخُرم',
      images: mainImageUrl ? [{ url: mainImageUrl, alt: recipe.nameFa }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${recipe.nameFa} | عسل باباخُرم`,
      description,
      images: mainImageUrl ? [mainImageUrl] : [],
    },
  };
}

export default async function RecipeDetailPage({ params }: RecipePageProps) {
  const { slug } = await params;
  const { recipe, relatedRecipes, redirect } = await getPublicRecipeBySlug(slug);

  // 1. Handle 301 Permanent Redirect
  if (redirect) {
    permanentRedirect(redirect.destination);
  }

  // 2. Handle 404 for Draft/Archived/Missing
  if (!recipe) {
    notFound();
  }

  // 3. Build JSON-LD (schema.org/Recipe per Brief Section 13)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://babakhorram.com';
  const mainImageUrl = recipe.mainImage
    ? `${siteUrl}/uploads/${recipe.mainImage.storageKey}`
    : undefined;

  const categoryNames = recipe.categories
    .map((c: any) => c.category?.name)
    .filter(Boolean);

  const ingredientList = recipe.ingredients.map((ing: any) => {
    const parts = [ing.name, ing.quantityText, ing.unit].filter(Boolean);
    if (ing.isOptional) parts.push('(اختیاری)');
    return parts.join(' ');
  });

  const instructionSteps = recipe.steps.map((step: any, idx: number) => ({
    '@type': 'HowToStep',
    position: idx + 1,
    text: step.text,
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.nameFa,
    image: mainImageUrl,
    description: recipe.shortDescription || recipe.longDescription || undefined,
    recipeYield: recipe.yieldText || undefined,
    recipeCuisine: recipe.country || undefined,
    recipeCategory: categoryNames.length > 0 ? categoryNames.join(', ') : undefined,
    recipeIngredient: ingredientList,
    recipeInstructions: instructionSteps,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RecipeDetailView
        recipe={recipe}
        relatedRecipes={relatedRecipes}
      />
    </>
  );
}
