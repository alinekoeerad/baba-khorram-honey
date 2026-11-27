import { z } from 'zod';

export const articleBlockSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('paragraph'),
    text: z.string().min(1, 'متن پاراگراف الزامی است'),
  }),
  z.object({
    type: z.literal('subheading'),
    text: z.string().min(1, 'عنوان زیربخش الزامی است'),
  }),
  z.object({
    type: z.literal('list'),
    items: z.array(z.string()).min(1, 'حداقل یک مورد برای لیست الزامی است'),
    ordered: z.boolean().optional(),
  }),
  z.object({
    type: z.literal('callout'),
    variant: z.enum(['warning', 'danger', 'tip', 'info']).default('info'),
    title: z.string().min(1, 'عنوان کادر الزامی است'),
    text: z.string().optional().nullable(),
    items: z.array(z.string()).optional().nullable(),
  }),
  z.object({
    type: z.literal('stats-grid'),
    items: z.array(
      z.object({
        label: z.string(),
        value: z.string(),
        note: z.string().optional().nullable(),
      })
    ),
  }),
  z.object({
    type: z.literal('comparison-table'),
    headers: z.tuple([z.string(), z.string(), z.string()]),
    rows: z.array(z.tuple([z.string(), z.string(), z.string()])),
  }),
  z.object({
    type: z.literal('study-cards'),
    cards: z.array(
      z.object({
        title: z.string(),
        summary: z.string(),
        points: z.array(z.string()),
      })
    ),
  }),
  z.object({
    type: z.literal('temperament-guide'),
  }),
]);

export const magazineSectionSchema = z.object({
  id: z.string().min(1, 'شناسه بخش الزامی است'),
  title: z.string().min(1, 'عنوان بخش الزامی است'),
  blocks: z.array(z.any()).default([]),
});

export const createMagazineArticleSchema = z.object({
  slug: z
    .string()
    .min(2, 'شناسه آدرس (slug) حداقل ۲ کاراکتر است')
    .max(100, 'شناسه آدرس حداکثر ۱۰۰ کاراکتر است')
    .regex(/^[a-z0-9-]+$/, 'شناسه فقط شامل حروف کوچک انگلیسی، اعداد و خط تیره (-) است')
    .trim(),
  title: z.string().min(3, 'عنوان مقاله حداقل ۳ کاراکتر است').max(250, 'عنوان مقاله حداکثر ۲۵۰ کاراکتر است').trim(),
  shortTitle: z.string().max(100).optional().nullable(),
  subtitle: z.string().max(350).optional().nullable(),
  excerpt: z.string().min(10, 'خلاصه مقاله حداقل ۱۰ کاراکتر است').max(600, 'خلاصه مقاله حداکثر ۶۰۰ کاراکتر است').trim(),
  coverImage: z.string().optional().nullable(),
  category: z.string().min(2, 'شناسه دسته‌بندی الزامی است').max(80).trim(),
  categoryLabel: z.string().max(100).optional().nullable(),
  badge: z.string().max(80).optional().nullable(),
  theme: z.enum(['AUTO', 'HONEY', 'ROYAL_JELLY', 'PROPOLIS', 'POLLEN', 'YELLOW', 'GREEN', 'ORANGE', 'BURGUNDY']).default('YELLOW'),
  readTime: z.string().max(60).optional().nullable(),
  readTimeMinutes: z.coerce.number().int().min(1).default(5),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('PUBLISHED'),
  sortOrder: z.coerce.number().int().default(0),
  featuredInNav: z.boolean().default(false),
  navOrder: z.coerce.number().int().default(0),
  sections: z.array(magazineSectionSchema).default([]),
  seoTitle: z.string().max(150).optional().nullable(),
  seoDescription: z.string().max(300).optional().nullable(),
});

export const updateMagazineArticleSchema = createMagazineArticleSchema.partial().extend({
  id: z.string().min(1, 'شناسه الزامی است'),
});

export const reorderMagazineArticlesSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      sortOrder: z.number().int(),
    })
  ),
});

export type CreateMagazineArticleInput = z.infer<typeof createMagazineArticleSchema>;
export type UpdateMagazineArticleInput = z.infer<typeof updateMagazineArticleSchema>;
export type ReorderMagazineArticlesInput = z.infer<typeof reorderMagazineArticlesSchema>;
