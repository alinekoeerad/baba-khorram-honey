import { describe, it, expect } from 'vitest';
import {
  controlledLinkSchema,
  resolveControlledLink,
  heroContentSchema,
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

