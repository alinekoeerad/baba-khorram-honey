import { describe, it, expect } from 'vitest';
import {
  controlledLinkSchema,
  resolveControlledLink,
  heroContentSchema,
  heroSlideSchema,
  imageTextContentSchema,
} from '@/server/validation/homepage-schemas';
import {
  switchSectionTemplate,
  analyzeTemplateSwitch,
  TEMPLATE_REGISTRY,
} from '@/server/services/homepage-template-service';

describe('Homepage CMS & Controlled Link Validation', () => {
  it('validates and resolves valid internal links', () => {
    const validInternal = controlledLinkSchema.parse({
      type: 'INTERNAL_PATH',
      path: '/feedback',
      label: 'انتقادات',
    });
    expect(validInternal.type).toBe('INTERNAL_PATH');
    const resolved = resolveControlledLink(validInternal);
    expect(resolved?.href).toBe('/feedback');
    expect(resolved?.label).toBe('انتقادات');
  });

  it('resolves product and recipe entity links', () => {
    const prodLink = controlledLinkSchema.parse({
      type: 'PRODUCT',
      targetId: 'mountain-astragalus-honey',
      label: 'مشاهده محصول',
    });
    expect(resolveControlledLink(prodLink)?.href).toBe('/products/mountain-astragalus-honey');

    const recLink = controlledLinkSchema.parse({
      type: 'RECIPE',
      targetId: 'honey-tea',
    });
    expect(resolveControlledLink(recLink)?.href).toBe('/recipes/honey-tea');
  });

  it('rejects malicious or protocol links in internal path', () => {
    expect(() =>
      controlledLinkSchema.parse({
        type: 'INTERNAL_PATH',
        path: 'javascript:alert(1)',
      })
    ).toThrow();

    expect(() =>
      controlledLinkSchema.parse({
        type: 'INTERNAL_PATH',
        path: '//evil.com/hack',
      })
    ).toThrow();

    expect(() =>
      controlledLinkSchema.parse({
        type: 'INTERNAL_PATH',
        path: 'relative-without-slash',
      })
    ).toThrow();
  });
});

describe('Template Switching & Preserved Bucket Roundtrip', () => {
  it('maps matching fields and preserves unmapped fields', () => {
    const initialHeroContent = {
      schemaVersion: 1,
      title: 'شاهکار طبیعت',
      subtitle: 'توضیحات هیرو که در قالب تصویر و متن نمایش داده نمی‌شود',
      images: [{ url: '/images/hero-1.jpg', alt: 'هیرو' }],
    };

    // Switch HERO (hero-default) -> IMAGE_TEXT (image-text-rect)
    const convertedToImageText = switchSectionTemplate(
      'hero-default',
      'image-text-rect',
      initialHeroContent
    );

    expect(convertedToImageText.title).toBe('شاهکار طبیعت');
    expect(convertedToImageText.image?.url).toBe('/images/hero-1.jpg');
    // subtitle should be safely preserved in preserved bucket
    expect(convertedToImageText.preserved?.subtitle).toBe(initialHeroContent.subtitle);

    // Switch back: IMAGE_TEXT (image-text-rect) -> HERO (hero-default)
    const roundtripHero = switchSectionTemplate(
      'image-text-rect',
      'hero-default',
      convertedToImageText
    );

    expect(roundtripHero.title).toBe('شاهکار طبیعت');
    expect(roundtripHero.subtitle).toBe(initialHeroContent.subtitle);
    expect(roundtripHero.images[0].url).toBe('/images/hero-1.jpg');
  });

  it('correctly maps title <-> heading alias', () => {
    const overlayContent = {
      schemaVersion: 1,
      heading: 'تیتر بزرگ بنر',
      image: { url: '/images/bees-banner.jpg', alt: 'بنر' },
    };

    const imageText = switchSectionTemplate(
      'overlay-center',
      'image-text-rect',
      overlayContent
    );

    expect(imageText.title).toBe('تیتر بزرگ بنر');
  });

  it('accurately analyzes mapped vs hidden fields for admin display', () => {
    const content = {
      title: 'عنوان بخش',
      subtitle: 'زیرعنوان',
      images: [{ url: '/images/hero-1.jpg', alt: '' }],
    };

    const analysis = analyzeTemplateSwitch('hero-default', 'image-text-rect', content);
    expect(analysis.mappedFields).toContain('title');
    expect(analysis.hiddenFields).toContain('subtitle');
  });

  it('validates deviceTarget and focalPoint with backward-compatible defaults', () => {
    const parsed = heroContentSchema.parse({
      title: 'عنوان هیرو',
      images: [
        { url: '/images/hero-1.jpg', alt: 'پیش‌فرض' },
        {
          url: '/images/hero-mobile.jpg',
          alt: 'موبایل',
          deviceTarget: 'mobile',
          focalPoint: 'top',
        },
        {
          url: '/images/hero-desktop.jpg',
          alt: 'دسکتاپ',
          deviceTarget: 'desktop',
          focalPoint: 'bottom',
        },
      ],
    });

    // Verify defaults
    expect(parsed.images[0].deviceTarget).toBe('all');
    expect(parsed.images[0].focalPoint).toBe('center');

    // Verify custom values
    expect(parsed.images[1].deviceTarget).toBe('mobile');
    expect(parsed.images[1].focalPoint).toBe('top');

    expect(parsed.images[2].deviceTarget).toBe('desktop');
    expect(parsed.images[2].focalPoint).toBe('bottom');
  });

  it('rejects invalid deviceTarget or focalPoint values', () => {
    expect(() =>
      heroContentSchema.parse({
        title: 'عنوان هیرو',
        images: [{ url: '/img.jpg', deviceTarget: 'tablet' as any }],
      })
    ).toThrow();

    expect(() =>
      heroContentSchema.parse({
        title: 'عنوان هیرو',
        images: [{ url: '/img.jpg', focalPoint: 'diagonal' as any }],
      })
    ).toThrow();
  });
});

describe('Hero Art Direction Validation & Backward Compatibility', () => {
  it('parses dedicated images for desktop, tablet, and mobile with asset IDs', () => {
    const slide = heroSlideSchema.parse({
      desktopImageUrl: '/uploads/hero-desktop.webp',
      desktopImageId: 'asset_desk_1',
      tabletImageUrl: '/uploads/hero-tablet.webp',
      tabletImageId: 'asset_tab_1',
      mobileImageUrl: '/uploads/hero-mobile.webp',
      mobileImageId: 'asset_mob_1',
      alt: 'تصویر هیرو کوهستان',
      focalPoint: 'top',
    });

    expect(slide.desktopImageUrl).toBe('/uploads/hero-desktop.webp');
    expect(slide.desktopImageId).toBe('asset_desk_1');
    expect(slide.tabletImageUrl).toBe('/uploads/hero-tablet.webp');
    expect(slide.tabletImageId).toBe('asset_tab_1');
    expect(slide.mobileImageUrl).toBe('/uploads/hero-mobile.webp');
    expect(slide.mobileImageId).toBe('asset_mob_1');
    // Backward compatibility: legacy url is synced to desktopImageUrl
    expect(slide.url).toBe('/uploads/hero-desktop.webp');
    expect(slide.alt).toBe('تصویر هیرو کوهستان');
    expect(slide.focalPoint).toBe('top');
  });

  it('automatically maps legacy url to desktopImageUrl when desktopImageUrl is not explicitly provided', () => {
    const slide = heroSlideSchema.parse({
      url: '/images/hero/photo_35.jpg',
      alt: 'عکس قدیمی',
    });

    expect(slide.desktopImageUrl).toBe('/images/hero/photo_35.jpg');
    expect(slide.url).toBe('/images/hero/photo_35.jpg');
    expect(slide.desktopImageId).toBeNull();
    expect(slide.tabletImageUrl).toBeNull();
    expect(slide.tabletImageId).toBeNull();
    expect(slide.mobileImageUrl).toBeNull();
    expect(slide.mobileImageId).toBeNull();
    expect(slide.deviceTarget).toBe('all');
  });

  it('allows tablet and mobile images to be optional (null fallback)', () => {
    const content = heroContentSchema.parse({
      title: 'شاهکار طبیعت',
      images: [
        {
          desktopImageUrl: '/images/hero/photo_35.jpg',
          desktopImageId: 'asset_1',
          alt: 'بدون تبلت و موبایل',
        },
      ],
    });

    expect(content.images[0].desktopImageUrl).toBe('/images/hero/photo_35.jpg');
    expect(content.images[0].tabletImageUrl).toBeNull();
    expect(content.images[0].mobileImageUrl).toBeNull();
  });

  it('rejects hero slides with neither desktopImageUrl nor legacy url', () => {
    expect(() =>
      heroSlideSchema.parse({
        alt: 'بدون هیچ تصویری',
      })
    ).toThrow('تصویر دسکتاپ (اصلی) الزامی است');

    expect(() =>
      heroSlideSchema.parse({
        desktopImageUrl: '   ',
        alt: 'فاصله خالی',
      })
    ).toThrow('تصویر دسکتاپ (اصلی) الزامی است');
  });

  it('preserves all three art-direction image slots across template roundtrip switches', () => {
    const originalHero = {
      schemaVersion: 1,
      title: 'عسل باباخرم',
      subtitle: 'طبیعی و خالص',
      images: [
        {
          desktopImageUrl: '/uploads/hero-desktop.webp',
          desktopImageId: 'desk_id',
          tabletImageUrl: '/uploads/hero-tablet.webp',
          tabletImageId: 'tab_id',
          mobileImageUrl: '/uploads/hero-mobile.webp',
          mobileImageId: 'mob_id',
          url: '/uploads/hero-desktop.webp',
          alt: 'شاهکار ارسباران',
        },
      ],
    };

    // HERO -> IMAGE_TEXT
    const imageText = switchSectionTemplate(
      'hero-default',
      'image-text-rect',
      originalHero
    );

    expect(imageText.title).toBe('عسل باباخرم');
    expect(imageText.image?.url).toBe('/uploads/hero-desktop.webp');

    // IMAGE_TEXT -> HERO
    const restoredHero = switchSectionTemplate(
      'image-text-rect',
      'hero-default',
      imageText
    );

    const validated = heroContentSchema.parse(restoredHero);
    expect(validated.title).toBe('عسل باباخرم');
    expect(validated.subtitle).toBe('طبیعی و خالص');
    expect(validated.images[0].desktopImageUrl).toBe('/uploads/hero-desktop.webp');
    expect(validated.images[0].desktopImageId).toBe('desk_id');
    expect(validated.images[0].tabletImageUrl).toBe('/uploads/hero-tablet.webp');
    expect(validated.images[0].tabletImageId).toBe('tab_id');
    expect(validated.images[0].mobileImageUrl).toBe('/uploads/hero-mobile.webp');
    expect(validated.images[0].mobileImageId).toBe('mob_id');
  });
});

