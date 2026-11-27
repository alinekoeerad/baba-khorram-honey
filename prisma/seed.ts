import { PrismaClient } from '@prisma/client';
import { FAQ_ENTRIES } from '../src/content/faq-data';
import { MAGAZINE_ARTICLES } from '../src/content/magazine-articles';

const prisma = new PrismaClient() as any;

export async function seedFaqs() {
  console.log(`[Seed] Seeding ${FAQ_ENTRIES.length} FAQ items idempotently...`);
  for (let idx = 0; idx < FAQ_ENTRIES.length; idx++) {
    const entry = FAQ_ENTRIES[idx];
    await prisma.faqItem.upsert({
      where: { anchorId: entry.id },
      create: {
        anchorId: entry.id,
        question: entry.question,
        answer: entry.shortAnswer,
        category: entry.category,
        categoryLabel: entry.categoryLabel,
        sortOrder: idx,
        isPublished: true,
        featuredInNav: Boolean(entry.featuredInNav),
        featuredOnHome: Boolean(entry.featuredOnHome),
        relatedArticleSlug: entry.relatedArticleSlug || null,
        relatedArticleLabel: entry.relatedArticleLabel || null,
        extraData: { blocks: entry.blocks },
      },
      update: {
        question: entry.question,
        answer: entry.shortAnswer,
        category: entry.category,
        categoryLabel: entry.categoryLabel,
        sortOrder: idx,
        featuredInNav: Boolean(entry.featuredInNav),
        featuredOnHome: Boolean(entry.featuredOnHome),
        relatedArticleSlug: entry.relatedArticleSlug || null,
        relatedArticleLabel: entry.relatedArticleLabel || null,
        extraData: { blocks: entry.blocks },
      },
    });
  }
  console.log(`[Seed] Successfully synced ${FAQ_ENTRIES.length} FAQ items.`);
}

export async function seedMagazineArticles() {
  console.log(`[Seed] Seeding ${MAGAZINE_ARTICLES.length} magazine articles idempotently...`);
  for (let idx = 0; idx < MAGAZINE_ARTICLES.length; idx++) {
    const a = MAGAZINE_ARTICLES[idx];
    await prisma.magazineArticle.upsert({
      where: { slug: a.slug },
      create: {
        slug: a.slug,
        title: a.title,
        shortTitle: a.shortTitle,
        subtitle: a.subtitle,
        excerpt: a.excerpt,
        coverImage: a.imageUrl,
        category: a.category,
        categoryLabel: a.categoryLabel,
        badge: a.badge,
        theme: a.theme,
        readTime: a.readTimeMinutes + ' دقیقه مطالعه',
        readTimeMinutes: a.readTimeMinutes,
        status: 'PUBLISHED',
        sortOrder: idx,
        featuredInNav: Boolean(a.featuredInNav),
        navOrder: a.navOrder || idx,
        sections: a.sections,
        seoTitle: `${a.shortTitle} | مجله علمی عسل باباخُرم`,
        seoDescription: a.excerpt,
        publishedAt: new Date('2026-10-08T00:00:00.000Z'),
      },
      update: {
        title: a.title,
        shortTitle: a.shortTitle,
        subtitle: a.subtitle,
        excerpt: a.excerpt,
        coverImage: a.imageUrl,
        category: a.category,
        categoryLabel: a.categoryLabel,
        badge: a.badge,
        theme: a.theme,
        readTime: a.readTimeMinutes + ' دقیقه مطالعه',
        readTimeMinutes: a.readTimeMinutes,
        sortOrder: idx,
        featuredInNav: Boolean(a.featuredInNav),
        navOrder: a.navOrder || idx,
        sections: a.sections,
        seoTitle: `${a.shortTitle} | مجله علمی عسل باباخُرم`,
        seoDescription: a.excerpt,
      },
    });
  }
  console.log(`[Seed] Successfully synced ${MAGAZINE_ARTICLES.length} magazine articles.`);
}

async function main() {
  await seedFaqs();
  await seedMagazineArticles();
}

if (process.env.NODE_ENV !== 'test') {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
