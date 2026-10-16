/**
 * Homepage Sections Queries (Brief Section 7)
 *
 * Implements:
 * - getPublicHomepageSections: returns only ACTIVE sections sorted by sortOrder
 * - getPreviewHomepageSections: returns all sections (including DRAFT, DISABLED)
 * - getHomepageSectionsAdmin: returns all sections for CMS management
 * - getHomepageSectionById: returns a specific section with its content and items
 * - Auto-initialization with canonical prototype sections if table is empty
 */

import { db } from '@/server/db/client';
import { SectionStatus, SectionType, SectionBackground } from '@prisma/client';

export interface HomepageSectionViewModel {
  id: string;
  type: string;
  template: string;
  status: SectionStatus;
  sortOrder: number;
  background: 'NONE' | 'WOOD';
  internalName: string;
  content: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_SECTIONS_INIT = [
  {
    internalName: 'اسلایدر هیرو اصلی',
    type: 'HERO' as SectionType,
    template: 'hero-default',
    status: 'ACTIVE' as SectionStatus,
    sortOrder: 0,
    background: 'NONE' as SectionBackground,
    content: {
      schemaVersion: 1,
      title: 'شاهکار بی‌نظیر طبیعت',
      subtitle: 'تغذیه اصیل، طعمی تکرارنشدنی و سرشار از انرژی طلایی برای زندگی روزمره',
      images: [
        { url: '/images/hero-1.jpg', alt: 'شهد زرین و کوهستان‌های سرسبز' },
        { url: '/images/beekeeping.jpg', alt: 'زنبورداری حرفه‌ای در مراتع' },
        { url: '/images/bees-banner.jpg', alt: 'کارِ زنبورها و شهد طبیعی' },
      ],
    },
  },
  {
    internalName: 'تجلیل از صنعت زنبورداری',
    type: 'IMAGE_TEXT' as SectionType,
    template: 'image-text-rect',
    status: 'ACTIVE' as SectionStatus,
    sortOrder: 1,
    background: 'NONE' as SectionBackground,
    content: {
      schemaVersion: 1,
      title: 'تجلیل از صنعت زنبورداری',
      body: 'شورای ملی عسل متعهد به اشتراک‌گذاری داستان‌های الهام‌بخش زنبورداران و تولیدکنندگان عسل از سراسر جهان است؛ با تأکید ویژه بر تأثیر شگرف و مثبتی که صنعت زنبورداری بر توسعه جوامع محلی، سلامت محیط‌زیست و تضمین امنیت چرخه غذایی ما بر جای می‌گذارد.',
      image: { url: '/images/beekeeping.jpg', alt: 'زنبوردار حرفه‌ای در حال سرکشی به کندوهای عسل' },
      imagePosition: 'RIGHT',
      theme: 'GREEN',
      cta: { type: 'PRODUCTS_PAGE', label: 'کسب اطلاعات بیشتر' },
    },
  },
  {
    internalName: 'بنر با افتخار کارِ زنبورها',
    type: 'FULL_IMAGE_OVERLAY' as SectionType,
    template: 'overlay-center',
    status: 'ACTIVE' as SectionStatus,
    sortOrder: 2,
    background: 'NONE' as SectionBackground,
    content: {
      schemaVersion: 1,
      kicker: 'با افتخار',
      heading: 'کارِ زنبورها',
      image: { url: '/images/bees-banner.jpg', alt: 'کارِ زنبورها' },
      theme: 'ORANGE',
      cta: { type: 'PRODUCTS_PAGE', label: 'مشاهده زنبورها' },
    },
  },
  {
    internalName: 'تنها ماده‌ای که از عهده هر کاری برمی‌آید',
    type: 'TEXT_GALLERY' as SectionType,
    template: 'text-gallery-default',
    status: 'ACTIVE' as SectionStatus,
    sortOrder: 3,
    background: 'NONE' as SectionBackground,
    content: {
      schemaVersion: 1,
      kicker: 'تنها ماده‌ای که از عهده',
      title: 'هر کاری برمی‌آید',
      body: 'عسل یک دستورالعمل تک‌مؤلفه‌ای و شگفت‌انگیز است که مستقیماً توسط زنبورها، شکوفه‌های گل و خودِ مادر طبیعت خلق شده است؛ بدون افزودنی، بدون دخالت مصنوعی و سرشار از آنتی‌اکسیدان‌ها و مواد معدنی حیاتی.',
      images: [{ url: '/images/blog-honey.jpg', alt: 'ظروف شیشه‌ای زیبا، موم زنبور و عسل طلایی' }],
      cta: { type: 'PRODUCTS_PAGE', label: 'شناخت بیشتر عسل' },
    },
  },
  {
    internalName: 'کاروسل دستور پخت‌های منتخب',
    type: 'CARD_CAROUSEL' as SectionType,
    template: 'carousel-cards',
    status: 'ACTIVE' as SectionStatus,
    sortOrder: 4,
    background: 'WOOD' as SectionBackground,
    content: {
      schemaVersion: 1,
      title: 'دستور پخت‌های منتخب',
      subtitle: 'ترکیبات، نوشیدنی‌ها و دسرهای اصیل تهیه‌شده با عسل خالص',
      source: 'RECIPES',
      maxItems: 12,
      cta: { type: 'RECIPES_PAGE', label: 'مشاهده همه دستورهای پخت' },
    },
  },
  {
    internalName: 'کاروسل محصولات ممتاز باباخُرم',
    type: 'CARD_CAROUSEL' as SectionType,
    template: 'carousel-cards',
    status: 'ACTIVE' as SectionStatus,
    sortOrder: 5,
    background: 'WOOD' as SectionBackground,
    content: {
      schemaVersion: 1,
      title: 'محصولات ممتاز باباخُرم',
      subtitle: 'عسل‌های خام و تک‌گل برداشت‌شده از پوشش گیاهی بکر و کوهستانی',
      source: 'PRODUCTS',
      maxItems: 12,
      cta: { type: 'PRODUCTS_PAGE', label: 'مشاهده همه محصولات' },
    },
  },
  {
    internalName: 'وبلاگ ماه ملی عسل',
    type: 'IMAGE_TEXT' as SectionType,
    template: 'image-text-circle',
    status: 'ACTIVE' as SectionStatus,
    sortOrder: 6,
    background: 'WOOD' as SectionBackground,
    content: {
      schemaVersion: 1,
      kicker: 'وبلاگ (THE BLOG)',
      title: 'ماه ملی عسل (HONEY MONTH)',
      body: 'چه می‌شد اگر شیرین‌کننده دلخواه شما، چیزی فراتر از صرفاً یک ماده شیرین بود؟ عسل با خود شیرینی اصیل، طعمی متمایز و بافتی بی‌همتا را به قلب آشپزخانه شما می‌آورد؛ و این فقط آغاز یک سفر خوش‌طعم است. در این ماه ملی عسل، تمامی دلایل فوق‌العاده برای حضور عسل در پخت‌وپز روزمره را با هم جشن می‌گیریم.',
      image: { url: '/images/honey-jar.jpg', alt: 'شیشه عسل طبیعی کهربایی شفاف با قاشق چوبی' },
      imagePosition: 'RIGHT',
      theme: 'GREEN',
      cta: { type: 'RECIPES_PAGE', label: 'ادامه مطلب' },
    },
  },
];

async function ensureDefaultSections(): Promise<void> {
  try {
    const count = await db.homepageSection.count();
    if (count === 0) {
      await db.$transaction(
        DEFAULT_SECTIONS_INIT.map((s) =>
          db.homepageSection.create({
            data: s,
          })
        )
      );
    }
  } catch {
    // If database unavailable or during build, skip
  }
}

/**
 * Public Homepage: returns strictly ACTIVE sections in sortOrder.
 */
export async function getPublicHomepageSections(): Promise<HomepageSectionViewModel[]> {
  await ensureDefaultSections();

  try {
    const sections = await db.homepageSection.findMany({
      where: {
        status: 'ACTIVE',
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    return sections.map((s: any) => ({
      id: s.id,
      type: s.type,
      template: s.template,
      status: s.status,
      sortOrder: s.sortOrder,
      background: s.background as 'NONE' | 'WOOD',
      internalName: s.internalName,
      content: (s.content as Record<string, any>) || {},
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
  } catch {
    return [];
  }
}

/**
 * Admin Preview Homepage: returns all sections including DRAFT and DISABLED.
 */
export async function getPreviewHomepageSections(): Promise<HomepageSectionViewModel[]> {
  await ensureDefaultSections();

  try {
    const sections = await db.homepageSection.findMany({
      orderBy: {
        sortOrder: 'asc',
      },
    });

    return sections.map((s: any) => ({
      id: s.id,
      type: s.type,
      template: s.template,
      status: s.status,
      sortOrder: s.sortOrder,
      background: s.background as 'NONE' | 'WOOD',
      internalName: s.internalName,
      content: (s.content as Record<string, any>) || {},
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
  } catch {
    return [];
  }
}

/**
 * Admin CMS list view: all sections ordered by sortOrder.
 */
export async function getHomepageSectionsAdmin(): Promise<HomepageSectionViewModel[]> {
  return getPreviewHomepageSections();
}

/**
 * Get single section for admin editing.
 */
export async function getHomepageSectionById(id: string): Promise<HomepageSectionViewModel | null> {
  try {
    const section = await db.homepageSection.findUnique({
      where: { id },
    });

    if (!section) return null;

    return {
      id: section.id,
      type: section.type,
      template: section.template,
      status: section.status,
      sortOrder: section.sortOrder,
      background: section.background as 'NONE' | 'WOOD',
      internalName: section.internalName,
      content: (section.content as Record<string, any>) || {},
      createdAt: section.createdAt,
      updatedAt: section.updatedAt,
    };
  } catch {
    return null;
  }
}
