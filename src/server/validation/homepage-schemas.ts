/**
 * Homepage Section CMS Validation Schemas (Brief Section 7)
 *
 * Implements:
 * - Controlled Links with strict path validation (starts with '/', no '//', no 'javascript:')
 * - Section Content Schemas per type and template with schemaVersion: 1
 * - Preserved bucket support for safe roundtrip template switching
 */

import { z } from 'zod';

// ---------------------------------------------------------------
// Controlled Link Schema
// ---------------------------------------------------------------

export const linkTypeEnum = z.enum([
  'NONE',
  'HOME',
  'PRODUCTS_PAGE',
  'RECIPES_PAGE',
  'PRODUCT',
  'RECIPE',
  'CATEGORY',
  'CONTACT_PAGE',
  'INTERNAL_PATH',
]);

export type LinkType = z.infer<typeof linkTypeEnum>;

export const controlledLinkSchema = z.object({
  type: linkTypeEnum.default('NONE'),
  targetId: z.string().optional().nullable(),
  path: z
    .string()
    .optional()
    .nullable()
    .refine((p) => {
      if (!p) return true;
      const clean = p.trim();
      // Must start with single '/', must not start with '//', must not include scheme or javascript:
      return clean.startsWith('/') && !clean.startsWith('//') && !clean.toLowerCase().includes('javascript:');
    }, {
      message: 'مسیر داخلی باید با / شروع شود و نباید شامل پروتکل، // یا کدهای جاوااسکریپت باشد.',
    }),
  label: z.string().max(80).optional().nullable(),
});

export type ControlledLink = z.infer<typeof controlledLinkSchema>;

// Helper to resolve a controlled link to an actual href
export function resolveControlledLink(link?: ControlledLink | null): { href: string; label: string } | null {
  if (!link || link.type === 'NONE') return null;
  const label = link.label?.trim() || 'مشاهده بیشتر';

  switch (link.type) {
    case 'HOME':
      return { href: '/', label };
    case 'PRODUCTS_PAGE':
      return { href: '/products', label: link.label?.trim() || 'مشاهده محصولات' };
    case 'RECIPES_PAGE':
      return { href: '/recipes', label: link.label?.trim() || 'مشاهده دستورها' };
    case 'CONTACT_PAGE':
      return { href: '/contact', label: link.label?.trim() || 'تماس با ما' };
    case 'PRODUCT':
      return link.targetId ? { href: `/products/${link.targetId}`, label } : null;
    case 'RECIPE':
      return link.targetId ? { href: `/recipes/${link.targetId}`, label } : null;
    case 'CATEGORY':
      return link.targetId ? { href: `/products?category=${link.targetId}`, label } : null;
    case 'INTERNAL_PATH':
      return link.path && link.path.startsWith('/') ? { href: link.path, label } : null;
    default:
      return null;
  }
}

// ---------------------------------------------------------------
// Section Image Schema
// ---------------------------------------------------------------

export const sectionImageSchema = z.object({
  url: z.string().min(1, 'آدرس یا شناسه تصویر الزامی است').trim(),
  alt: z.string().max(200, 'متن جایگزین حداکثر ۲۰۰ کاراکتر است').default(''),
});

export type SectionImage = z.infer<typeof sectionImageSchema>;

// ---------------------------------------------------------------
// Per-Type Content Schemas
// ---------------------------------------------------------------

// 1. HERO (hero-default)
export const heroContentSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  title: z.string().min(1, 'عنوان هیرو الزامی است').max(120, 'عنوان حداکثر ۱۲۰ کاراکتر است').trim(),
  subtitle: z.string().max(250, 'زیرعنوان حداکثر ۲۵۰ کاراکتر است').optional().nullable(),
  images: z.array(sectionImageSchema).min(1, 'حداقل ۱ تصویر الزامی است').max(8, 'حداکثر ۸ تصویر مجاز است'),
  preserved: z.record(z.string(), z.any()).optional(),
});

export type HeroContent = z.infer<typeof heroContentSchema>;

// 2. IMAGE_TEXT (image-text-rect, image-text-circle)
export const imageTextContentSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  kicker: z.string().max(60, 'روتیتر حداکثر ۶۰ کاراکتر است').optional().nullable(),
  title: z.string().min(1, 'عنوان بخش الزامی است').max(120, 'عنوان حداکثر ۱۲۰ کاراکتر است').trim(),
  body: z.string().min(1, 'متن بدنه الزامی است').max(1000, 'متن بدنه حداکثر ۱۰۰۰ کاراکتر است').trim(),
  image: sectionImageSchema,
  imagePosition: z.enum(['LEFT', 'RIGHT']).default('RIGHT'),
  theme: z.enum(['GREEN', 'ORANGE', 'GOLD']).default('GREEN'),
  cta: controlledLinkSchema.optional().nullable(),
  preserved: z.record(z.string(), z.any()).optional(),
});

export type ImageTextContent = z.infer<typeof imageTextContentSchema>;

// 3. FULL_IMAGE_OVERLAY (overlay-center)
export const fullImageOverlayContentSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  kicker: z.string().max(60, 'روتیتر حداکثر ۶۰ کاراکتر است').optional().nullable(),
  heading: z.string().min(1, 'تیتر بزرگ الزامی است').max(120, 'تیتر بزرگ حداکثر ۱۲۰ کاراکتر است').trim(),
  body: z.string().max(500, 'متن توضیحات حداکثر ۵۰۰ کاراکتر است').optional().nullable(),
  image: sectionImageSchema,
  theme: z.enum(['GREEN', 'ORANGE', 'GOLD']).default('ORANGE'),
  cta: controlledLinkSchema.optional().nullable(),
  preserved: z.record(z.string(), z.any()).optional(),
});

export type FullImageOverlayContent = z.infer<typeof fullImageOverlayContentSchema>;

// 4. TEXT_GALLERY (text-gallery-default)
export const textGalleryContentSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  kicker: z.string().max(60, 'روتیتر حداکثر ۶۰ کاراکتر است').optional().nullable(),
  title: z.string().min(1, 'عنوان الزامی است').max(120, 'عنوان حداکثر ۱۲۰ کاراکتر است').trim(),
  body: z.string().min(1, 'متن الزامی است').max(1000, 'متن حداکثر ۱۰۰۰ کاراکتر است').trim(),
  images: z.array(sectionImageSchema).min(1, 'حداقل ۱ تصویر الزامی است').max(4, 'حداکثر ۴ تصویر مجاز است'),
  cta: controlledLinkSchema.optional().nullable(),
  preserved: z.record(z.string(), z.any()).optional(),
});

export type TextGalleryContent = z.infer<typeof textGalleryContentSchema>;

// 5. CARD_CAROUSEL (carousel-cards)
export const cardCarouselContentSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  title: z.string().max(100, 'عنوان اسلایدر حداکثر ۱۰۰ کاراکتر است').optional().nullable(),
  subtitle: z.string().max(200, 'زیرعنوان اسلایدر حداکثر ۲۰۰ کاراکتر است').optional().nullable(),
  source: z.enum(['RECIPES', 'PRODUCTS', 'SELECTED']).default('RECIPES'),
  selectedItems: z.array(z.string()).default([]),
  maxItems: z.coerce.number().int().min(1).max(24).default(12),
  cta: controlledLinkSchema.optional().nullable(),
  preserved: z.record(z.string(), z.any()).optional(),
});

export type CardCarouselContent = z.infer<typeof cardCarouselContentSchema>;

// 6. CONTENT_GRID (grid-default)
export const gridItemSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
  image: sectionImageSchema.optional().nullable(),
  title: z.string().min(1, 'عنوان آیتم الزامی است').max(100, 'عنوان آیتم حداکثر ۱۰۰ کاراکتر است').trim(),
  description: z.string().max(300, 'توضیحات آیتم حداکثر ۳۰۰ کاراکتر است').optional().nullable(),
  link: controlledLinkSchema.optional().nullable(),
});

export type GridItem = z.infer<typeof gridItemSchema>;

export const contentGridContentSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  title: z.string().max(100, 'عنوان گرید حداکثر ۱۰۰ کاراکتر است').optional().nullable(),
  items: z.array(gridItemSchema).max(12, 'حداکثر ۱۲ آیتم مجاز است').default([]),
  preserved: z.record(z.string(), z.any()).optional(),
});

export type ContentGridContent = z.infer<typeof contentGridContentSchema>;

// ---------------------------------------------------------------
// Section CRUD Input Schema
// ---------------------------------------------------------------

export const sectionTypeEnum = z.enum([
  'HERO',
  'IMAGE_TEXT',
  'FULL_IMAGE_OVERLAY',
  'TEXT_GALLERY',
  'CARD_CAROUSEL',
  'CONTENT_GRID',
]);

export const sectionStatusEnum = z.enum(['DRAFT', 'ACTIVE', 'DISABLED']);
export const sectionBackgroundEnum = z.enum(['NONE', 'WOOD']);

export const homepageSectionInputSchema = z.object({
  internalName: z.string().min(1, 'نام داخلی سکشن الزامی است').max(100).trim(),
  type: sectionTypeEnum,
  template: z.string().min(1, 'قالب سکشن الزامی است').trim(),
  status: sectionStatusEnum.default('DRAFT'),
  background: sectionBackgroundEnum.default('NONE'),
  sortOrder: z.coerce.number().int().default(0),
  content: z.record(z.string(), z.any()).default({}),
});

export type HomepageSectionInput = z.infer<typeof homepageSectionInputSchema>;
