import { PrismaClient } from '@prisma/client';
import { FAQ_ENTRIES } from '../src/content/faq-data';

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

async function main() {
  await seedFaqs();
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
