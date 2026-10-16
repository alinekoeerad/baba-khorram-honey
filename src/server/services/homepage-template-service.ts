/**
 * Homepage Template Service (Brief Section 7)
 *
 * Implements:
 * - Template Registry with metadata, types, and visual preview definitions
 * - Safe template switching with same-name field mapping and hidden `preserved` bucket
 * - Roundtrip preservation (switching A -> B -> A restores all original data)
 */

import { SectionType } from '@prisma/client';

export interface TemplateDefinition {
  id: string;
  name: string;
  sectionType: SectionType;
  description: string;
  supportedFields: string[];
  thumbnail: string;
  defaultBackground: 'NONE' | 'WOOD';
}

export const TEMPLATE_REGISTRY: Record<string, TemplateDefinition> = {
  'hero-default': {
    id: 'hero-default',
    name: 'اسلایدر هیرو تمام‌عرض',
    sectionType: 'HERO',
    description: 'گردش اتوماتیک ۱ تا ۸ تصویر با کیفیت همراه با انیمیشن زوم و تیتر مرکزی',
    supportedFields: ['title', 'subtitle', 'images'],
    thumbnail: '/images/hero-1.jpg',
    defaultBackground: 'NONE',
  },
  'image-text-rect': {
    id: 'image-text-rect',
    name: 'تصویر مستطیلی و متن',
    sectionType: 'IMAGE_TEXT',
    description: 'تصویر شاخص در یک سمت و متن، روتیتر و دکمه در سمت دیگر',
    supportedFields: ['kicker', 'title', 'body', 'image', 'imagePosition', 'theme', 'cta'],
    thumbnail: '/images/beekeeping.jpg',
    defaultBackground: 'NONE',
  },
  'image-text-circle': {
    id: 'image-text-circle',
    name: 'تصویر قاب دایره‌ای روی چوب',
    sectionType: 'IMAGE_TEXT',
    description: 'تصویر گرد در کادر سفید سنتی، مناسب برای پس‌زمینه چوبی',
    supportedFields: ['kicker', 'title', 'body', 'image', 'imagePosition', 'theme', 'cta'],
    thumbnail: '/images/honey-jar.jpg',
    defaultBackground: 'WOOD',
  },
  'overlay-center': {
    id: 'overlay-center',
    name: 'بنر تمام‌تصویر با پوشش متن',
    sectionType: 'FULL_IMAGE_OVERLAY',
    description: 'تصویر تمام‌عرض تیره با متن بزرگ و دکمه در مرکز',
    supportedFields: ['kicker', 'heading', 'body', 'image', 'theme', 'cta'],
    thumbnail: '/images/bees-banner.jpg',
    defaultBackground: 'NONE',
  },
  'text-gallery-default': {
    id: 'text-gallery-default',
    name: 'متن با گالری چندتصویره',
    sectionType: 'TEXT_GALLERY',
    description: 'ترکیب متن همراه با ۱ تا ۴ تصویر چیدمان‌شده',
    supportedFields: ['kicker', 'title', 'body', 'images', 'cta'],
    thumbnail: '/images/blog-honey.jpg',
    defaultBackground: 'NONE',
  },
  'carousel-cards': {
    id: 'carousel-cards',
    name: 'کاروسل چرخشی کارت‌ها',
    sectionType: 'CARD_CAROUSEL',
    description: 'اسلایدر نامحدود و مداوم کارت‌های محصولات یا دستورها روی پس‌زمینه چوبی',
    supportedFields: ['title', 'subtitle', 'source', 'selectedItems', 'maxItems', 'cta'],
    thumbnail: '/images/recipe-1.jpg',
    defaultBackground: 'WOOD',
  },
  'grid-default': {
    id: 'grid-default',
    name: 'گرید محتوایی چندستونه',
    sectionType: 'CONTENT_GRID',
    description: 'شبکه محتوایی از آیتم‌ها همراه با عنوان، توضیح و پیوند',
    supportedFields: ['title', 'items'],
    thumbnail: '/images/recipe-2.jpg',
    defaultBackground: 'NONE',
  },
  'heritage-default': {
    id: 'heritage-default',
    name: 'اصالت، میراث و فرآیند تولید عسل',
    sectionType: 'ARTISAN_HERITAGE',
    description: 'معرفی اصالت زنبورداری سنتی، استانداردهای آزمایشگاهی و فرآیند برداشت طبیعی',
    supportedFields: ['title', 'subtitle', 'features'],
    thumbnail: '/images/beekeeping.jpg',
    defaultBackground: 'NONE',
  },
  'honey-finder-default': {
    id: 'honey-finder-default',
    name: 'راهنمای هوشمند انتخاب عسل',
    sectionType: 'HONEY_FINDER',
    description: 'ابزار تعاملی پیشنهاد عسل بر اساس طبع، فواید درمانی و کاربرد مورد نظر کاربر',
    supportedFields: ['title', 'subtitle'],
    thumbnail: '/images/honey-jar.jpg',
    defaultBackground: 'NONE',
  },
  'testimonials-default': {
    id: 'testimonials-default',
    name: 'دیدگاه‌ها و رضایت مشتریان',
    sectionType: 'TESTIMONIALS',
    description: 'نمایش تجربیات و بازخوردهای خریداران واقعی از کیفیت و خلوص عسل باباخُرم',
    supportedFields: ['title', 'subtitle', 'items'],
    thumbnail: '/images/hero-1.jpg',
    defaultBackground: 'NONE',
  },
  'faq-default': {
    id: 'faq-default',
    name: 'پرسش‌های متداول مشتریان',
    sectionType: 'FAQ_SECTION',
    description: 'پاسخ به سوالات رایج درباره شکرک زدن، روش مصرف و ارسال سفارشات',
    supportedFields: ['title', 'subtitle', 'items'],
    thumbnail: '/images/blog-honey.jpg',
    defaultBackground: 'NONE',
  },
};

// Aliases for equivalent field names (e.g. title <-> heading)
const FIELD_ALIASES: Record<string, string> = {
  heading: 'title',
  title: 'heading',
};

/**
 * Switch a section's template with field mapping and the `preserved` bucket.
 * Roundtrip test: A -> B -> A restores all original data without silent loss.
 */
export function switchSectionTemplate(
  oldTemplateId: string,
  newTemplateId: string,
  currentContent: Record<string, any>
): Record<string, any> {
  const newDef = TEMPLATE_REGISTRY[newTemplateId];
  if (!newDef) {
    throw new Error(`قالب مقصد نامعتبر است: ${newTemplateId}`);
  }

  // Combine current visible content with previously preserved fields
  const previousPreserved = currentContent.preserved || {};
  const allKnownData: Record<string, any> = { ...previousPreserved, ...currentContent };
  delete allKnownData.preserved;
  delete allKnownData.schemaVersion;

  const newContent: Record<string, any> = {
    schemaVersion: 1,
  };

  const supportedSet = new Set(newDef.supportedFields);
  const preservedBucket: Record<string, any> = {};

  // 1. Direct matches & alias mappings
  for (const field of newDef.supportedFields) {
    if (allKnownData[field] !== undefined) {
      newContent[field] = allKnownData[field];
    } else {
      // Check alias (e.g. heading <-> title)
      const alias = FIELD_ALIASES[field];
      if (alias && allKnownData[alias] !== undefined) {
        newContent[field] = allKnownData[alias];
      }
    }
  }

  // 2. Put all other non-supported keys into preserved
  for (const [key, val] of Object.entries(allKnownData)) {
    if (!supportedSet.has(key)) {
      preservedBucket[key] = val;
    }
  }

  // Keep single image <-> images array compatibility if possible
  if (supportedSet.has('image') && !newContent.image && Array.isArray(allKnownData.images) && allKnownData.images.length > 0) {
    newContent.image = allKnownData.images[0];
  } else if (supportedSet.has('images') && (!newContent.images || newContent.images.length === 0) && allKnownData.image) {
    newContent.images = [allKnownData.image];
  }

  if (Object.keys(preservedBucket).length > 0) {
    newContent.preserved = preservedBucket;
  }

  return newContent;
}

/**
 * Analyze template switch to show the admin which fields carry over and which are preserved.
 */
export function analyzeTemplateSwitch(
  oldTemplateId: string,
  newTemplateId: string,
  currentContent: Record<string, any>
): {
  mappedFields: string[];
  hiddenFields: string[];
} {
  const newDef = TEMPLATE_REGISTRY[newTemplateId];
  if (!newDef) {
    return { mappedFields: [], hiddenFields: [] };
  }

  const supportedSet = new Set(newDef.supportedFields);
  const previousPreserved = currentContent.preserved || {};
  const allKeys = Array.from(new Set([...Object.keys(currentContent), ...Object.keys(previousPreserved)])).filter(
    (k) => k !== 'preserved' && k !== 'schemaVersion'
  );

  const mappedFields: string[] = [];
  const hiddenFields: string[] = [];

  for (const key of allKeys) {
    const alias = FIELD_ALIASES[key];
    if (supportedSet.has(key) || (alias && supportedSet.has(alias))) {
      mappedFields.push(key);
    } else {
      hiddenFields.push(key);
    }
  }

  return { mappedFields, hiddenFields };
}
