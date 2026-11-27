import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MagazineArticleView } from '@/components/public/magazine-article-view';
import { MAGAZINE_ARTICLES } from '@/content/magazine-articles';
import { getPublicMagazineArticleBySlug } from '@/server/services/magazine-service';
import { serializeJsonLd } from '@/lib/utils';

export const revalidate = 3600;

export async function generateStaticParams() {
  return MAGAZINE_ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublicMagazineArticleBySlug(slug);
  if (!article) {
    return { title: 'مقاله یافت نشد | مجله علمی باباخُرم' };
  }

  const title = (article as any).seoTitle || `${article.shortTitle} | مجله علمی عسل باباخُرم`;
  const description = (article as any).seoDescription || article.excerpt;

  return {
    title,
    description,
    alternates: {
      canonical: `/magazine/${article.slug}`,
    },
    openGraph: {
      title: article.title,
      description,
      type: 'article',
      images: [article.imageUrl],
    },
  };
}

export default async function MagazineArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getPublicMagazineArticleBySlug(slug);
  if (!article) {
    notFound();
  }

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    image: article.imageUrl,
    publisher: {
      '@type': 'Organization',
      name: 'عسل باباخُرم',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleSchema) }}
      />
      <MagazineArticleView article={article} />
    </>
  );
}
