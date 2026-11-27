import { z } from 'zod';

export const faqContentBlockSchema = z.object({
  type: z.enum(['paragraph', 'heading', 'list', 'callout']),
  title: z.string().optional().nullable(),
  text: z.string().optional().nullable(),
  items: z.array(z.string()).optional().nullable(),
  variant: z.enum(['info', 'warning', 'tip']).optional().nullable(),
  ctaHref: z.string().optional().nullable(),
  ctaLabel: z.string().optional().nullable(),
});

export const createFaqSchema = z.object({
  anchorId: z
    .string()
    .min(2, 'شناسه لنگر (anchorId) حداقل ۲ کاراکتر است')
    .max(80, 'شناسه لنگر حداکثر ۸۰ کاراکتر است')
    .regex(/^[a-z0-9-]+$/, 'شناسه لنگر فقط شامل حروف کوچک انگلیسی، اعداد و خط تیره (-) است')
    .trim(),
  question: z.string().min(5, 'پرسش حداقل ۵ کاراکتر است').max(300, 'پرسش حداکثر ۳۰۰ کاراکتر است').trim(),
  answer: z.string().min(10, 'پاسخ کوتاه حداقل ۱۰ کاراکتر است').max(3000, 'پاسخ کوتاه حداکثر ۳۰۰۰ کاراکتر است').trim(),
  category: z.string().min(2, 'شناسه دسته‌بندی الزامی است').max(60).trim(),
  categoryLabel: z.string().max(80).optional().nullable(),
  sortOrder: z.coerce.number().int().default(0),
  isPublished: z.boolean().default(true),
  featuredInNav: z.boolean().default(false),
  featuredOnHome: z.boolean().default(false),
  relatedArticleSlug: z.string().max(100).optional().nullable(),
  relatedArticleLabel: z.string().max(100).optional().nullable(),
  blocks: z.array(faqContentBlockSchema).default([]),
});

export const updateFaqSchema = createFaqSchema.partial().extend({
  id: z.string().min(1, 'شناسه الزامی است'),
});

export const reorderFaqsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      sortOrder: z.number().int(),
    })
  ),
});

export type CreateFaqInput = z.infer<typeof createFaqSchema>;
export type UpdateFaqInput = z.infer<typeof updateFaqSchema>;
export type ReorderFaqsInput = z.infer<typeof reorderFaqsSchema>;
