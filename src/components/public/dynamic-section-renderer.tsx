/**
 * Dynamic Section Renderer (Brief Section 7)
 * Renders CMS homepage sections using the exact authentic public components.
 * Supports consecutive WOOD background merging without seams.
 */

import React from 'react';
import { HomepageSectionViewModel } from '@/server/queries/homepage-sections';
import { WoodBackground } from '@/components/ui/wood-background';
import { Container } from '@/components/ui/container';
import { PillButton } from '@/components/ui/pill-button';
import { HeroSlider } from '@/components/public/hero-slider';
import { RecipeCarousel } from '@/components/public/recipe-carousel';
import { ProductCarousel } from '@/components/public/product-carousel';
import { ArtisanHeritageShowcase } from '@/components/public/artisan-heritage-showcase';
import { HoneyFinder } from '@/components/public/honey-finder';
import { TestimonialsSection } from '@/components/public/testimonials-section';
import { FaqSection } from '@/components/public/faq-section';
import { resolveControlledLink } from '@/server/validation/homepage-schemas';
import Link from 'next/link';

interface DynamicSectionRendererProps {
  section: HomepageSectionViewModel;
  products?: any[];
  recipes?: any[];
  noBackground?: boolean;
}

export function DynamicSectionRenderer({
  section,
  products = [],
  recipes = [],
  noBackground = false,
}: DynamicSectionRendererProps) {
  const { type, template, background, content } = section;
  const isWood = background === 'WOOD';

  // Client Request: Cancel/remove video section from homepage
  if (type === 'VIDEO') {
    return null;
  }

  // 1. HERO Section
  if (type === 'HERO') {
    const images = Array.isArray(content.images) && content.images.length > 0
      ? content.images
      : [{ url: '/images/hero-1.jpg', alt: '' }];
    const title = content.title || 'عسل خالص و طبیعی باباخُرم';
    const subtitle = content.subtitle || 'برداشت مستقیم از بهترین مراتع ییلاقی ارسباران، با حفظ ۱۰۰٪ خواص زیستی و دارویی';

    return (
      <div id={`section-${section.id}`} className="w-full">
        <HeroSlider images={images} title={title} subtitle={subtitle} />
      </div>
    );
  }

  // 2. IMAGE_TEXT Section (image-text-rect & image-text-circle)
  if (type === 'IMAGE_TEXT') {
    const isCircle = template === 'image-text-circle';
    const imagePosition = content.imagePosition || 'RIGHT';
    const theme = content.theme || 'GREEN';
    const kicker = content.kicker;
    const title = content.title || '';
    const body = content.body || '';
    const resolvedCta = resolveControlledLink(content.cta);
    const imageUrl = content.image?.url || '/images/beekeeping.jpg';
    const imageAlt = content.image?.alt || title;

    const themeColors = {
      GREEN: { title: 'text-[#2E6930]', btn: 'green' as const },
      ORANGE: { title: 'text-[#C86A00]', btn: 'orange' as const },
      GOLD: { title: 'text-[#D97706]', btn: 'gold' as const },
    }[theme as 'GREEN' | 'ORANGE' | 'GOLD'] || { title: 'text-[#2E6930]', btn: 'green' as const };

    const contentBlock = (
      <div className="lg:col-span-7 space-y-5 text-right">
        {kicker && (
          <div className={`text-sm sm:text-base font-black tracking-widest uppercase drop-shadow-xs ${isWood ? 'text-[#B45309]' : 'text-emerald-700'}`}>
            {kicker}
          </div>
        )}
        <h2 className={`text-2xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight ${isWood ? 'text-[#2B2017]' : themeColors.title}`}>
          {title}
        </h2>
        <p className={`text-sm sm:text-base lg:text-lg leading-loose text-justify font-medium ${isWood ? 'text-[#5C5248]' : 'text-[#4A423A]'}`}>
          {body}
        </p>
        {resolvedCta && (
          <div className="pt-2">
            <PillButton variant={themeColors.btn} size="lg" href={resolvedCta.href}>
              {resolvedCta.label}
            </PillButton>
          </div>
        )}
      </div>
    );

    const imageBlock = (
      <div className="lg:col-span-5 flex justify-center">
        {isCircle ? (
          <div className="w-56 h-56 sm:w-80 sm:h-80 lg:w-92 lg:h-92 rounded-full overflow-hidden border-4 sm:border-8 border-white shadow-2xl">
            <img src={imageUrl} alt={imageAlt} className="w-full h-full object-cover object-center rounded-full" />
          </div>
        ) : (
          <div className="w-full max-w-md lg:max-w-none overflow-hidden rounded-none shadow-md">
            <img src={imageUrl} alt={imageAlt} className="w-full h-auto object-cover" />
          </div>
        )}
      </div>
    );

    const inner = (
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 items-center">
          {imagePosition === 'RIGHT' ? (
            <>
              {contentBlock}
              {imageBlock}
            </>
          ) : (
            <>
              {imageBlock}
              {contentBlock}
            </>
          )}
        </div>
      </Container>
    );

    if (isWood) {
      if (noBackground) {
        return (
          <section id={`section-${section.id}`} className="py-14 sm:py-20 lg:py-28 border-none overflow-hidden">
            {inner}
          </section>
        );
      }
      return (
        <WoodBackground id={`section-${section.id}`} className="py-14 sm:py-20 lg:py-28 border-none overflow-hidden">
          {inner}
        </WoodBackground>
      );
    }

    return (
      <section id={`section-${section.id}`} className="py-14 sm:py-20 lg:py-24 bg-white overflow-hidden">
        {inner}
      </section>
    );
  }

  // 3. FULL_IMAGE_OVERLAY (overlay-center)
  if (type === 'FULL_IMAGE_OVERLAY') {
    const heading = content.heading || content.title || 'کارِ زنبورها';
    const kicker = content.kicker || 'با افتخار';
    const body = content.body;
    const imageUrl = content.image?.url || '/images/bees-banner.jpg';
    const resolvedCta = resolveControlledLink(content.cta);
    const theme = content.theme || 'ORANGE';
    const btnVariant = theme === 'GREEN' ? 'green' : theme === 'GOLD' ? 'gold' : 'orange';

    return (
      <section
        id={`section-${section.id}`}
        className="relative py-16 sm:py-24 lg:py-28 text-center text-white bg-[#2C1D11] bg-cover bg-center overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(28, 16, 7, 0.55) 0%, rgba(28, 16, 7, 0.78) 100%), url('${imageUrl}')`,
        }}
      >
        <Container size="narrow" className="space-y-4 px-4">
          {kicker && (
            <div className="text-lg sm:text-2xl font-black text-white tracking-widest drop-shadow-md">
              {kicker}
            </div>
          )}
          <h2 className="text-3xl sm:text-5xl lg:text-7xl font-black text-[#FBBF24] drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] leading-tight">
            {heading}
          </h2>
          {body && (
            <p className="text-base sm:text-lg text-white/90 max-w-xl mx-auto font-bold leading-relaxed">
              {body}
            </p>
          )}
          {resolvedCta && (
            <div className="pt-4 sm:pt-6">
              <PillButton variant={btnVariant as any} size="lg" href={resolvedCta.href}>
                {resolvedCta.label}
              </PillButton>
            </div>
          )}
        </Container>
      </section>
    );
  }

  // 4. TEXT_GALLERY (text-gallery-default)
  if (type === 'TEXT_GALLERY') {
    const kicker = content.kicker || 'تنها ماده‌ای که از عهده';
    const title = content.title || 'هر کاری برمی‌آید';
    const body = content.body || 'عسل یک دستورالعمل تک‌مؤلفه‌ای و شگفت‌انگیز است...';
    const images = Array.isArray(content.images) && content.images.length > 0
      ? content.images
      : [{ url: '/images/blog-honey.jpg', alt: '' }];
    const resolvedCta = resolveControlledLink(content.cta);

    return (
      <section id={`section-${section.id}`} className="py-14 sm:py-20 lg:py-28 bg-white overflow-hidden">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12 lg:gap-16 items-center">
            {/* Gallery Image */}
            <div className="lg:col-span-5 flex justify-center relative">
              <div className="relative w-64 sm:w-80 lg:w-88 flex items-center justify-center">
                <img
                  src={images[0]?.url || '/images/blog-honey.jpg'}
                  alt={images[0]?.alt || title}
                  className="w-full h-auto object-contain drop-shadow-2xl z-10"
                />
              </div>
            </div>

            {/* Text Wrap */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-5 text-right">
              {kicker && (
                <div className="text-lg sm:text-2xl font-black text-[#382A20]">
                  {kicker}
                </div>
              )}
              <h2 className="text-2xl sm:text-4xl lg:text-6xl font-black text-[#C86A00] leading-tight sm:leading-none">
                {title}
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-[#332115] leading-loose text-justify font-bold">
                {body}
              </p>
              {resolvedCta && (
                <div className="pt-2">
                  <PillButton variant="gold" size="lg" href={resolvedCta.href}>
                    {resolvedCta.label}
                  </PillButton>
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>
    );
  }

  // 5. CARD_CAROUSEL (carousel-cards)
  if (type === 'CARD_CAROUSEL') {
    const source = content.source || 'RECIPES';
    const maxItems = content.maxItems || 12;

    if (source === 'SELECTED') {
      const selectedIds: string[] = Array.isArray(content.selectedItems) ? content.selectedItems : [];
      const matchedProducts = products.filter(
        (p) => (p.status === 'PUBLISHED' || !p.status) && selectedIds.includes(p.id)
      );
      const matchedRecipes = recipes.filter(
        (r) => (r.status === 'PUBLISHED' || !r.status) && selectedIds.includes(r.id)
      );

      if (matchedProducts.length >= matchedRecipes.length && matchedProducts.length > 0) {
        let displayList = [...matchedProducts];
        if (displayList.length < 3) {
          const backfill = products.filter(
            (p) => (p.status === 'PUBLISHED' || !p.status) && !displayList.some((d) => d.id === p.id)
          );
          displayList = [...displayList, ...backfill].slice(0, Math.max(maxItems, 3));
        } else {
          displayList = displayList.slice(0, maxItems);
        }
        if (displayList.length === 0) return null;
        return (
          <div id={`section-${section.id}`}>
            <ProductCarousel products={displayList} noBackground={noBackground || isWood} />
          </div>
        );
      } else if (matchedRecipes.length > 0) {
        let displayList = [...matchedRecipes];
        if (displayList.length < 3) {
          const backfill = recipes.filter(
            (r) => (r.status === 'PUBLISHED' || !r.status) && !displayList.some((d) => d.id === r.id)
          );
          displayList = [...displayList, ...backfill].slice(0, Math.max(maxItems, 3));
        } else {
          displayList = displayList.slice(0, maxItems);
        }
        if (displayList.length === 0) return null;
        return (
          <div id={`section-${section.id}`}>
            <RecipeCarousel recipes={displayList} noBackground={noBackground || isWood} />
          </div>
        );
      } else {
        return null;
      }
    }

    if (source === 'PRODUCTS') {
      if (!products || products.length === 0) return null;
      return (
        <div id={`section-${section.id}`}>
          <ProductCarousel products={products} noBackground={noBackground || isWood} />
        </div>
      );
    }

    if (!recipes || recipes.length === 0) return null;
    return (
      <div id={`section-${section.id}`}>
        <RecipeCarousel recipes={recipes} noBackground={noBackground || isWood} />
      </div>
    );
  }

  // 6. CONTENT_GRID (grid-default)
  if (type === 'CONTENT_GRID') {
    const title = content.title || 'ویژگی‌های عسل باباخُرم';
    const items = Array.isArray(content.items) ? content.items : [];

    const inner = (
      <Container>
        {title && (
          <h2 className={`text-2xl sm:text-4xl font-black text-center mb-10 drop-shadow-xs ${isWood ? 'text-[#2B2017]' : 'text-[#332115]'}`}>
            {title}
          </h2>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((it: any) => {
            const link = resolveControlledLink(it.link);
            return (
              <div
                key={it.id}
                className="p-6 bg-white border border-stone-200 shadow-sm rounded-none text-right flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {it.image?.url && (
                    <div className="w-12 h-12 rounded-lg bg-stone-100 flex items-center justify-center p-2 mb-2">
                      <img src={it.image.url} alt={it.image.alt || it.title} className="w-full h-full object-contain" />
                    </div>
                  )}
                  <h3 className="font-black text-lg text-[#2B2017]">{it.title}</h3>
                  {it.description && (
                    <p className="text-xs sm:text-sm text-stone-600 font-bold leading-relaxed">
                      {it.description}
                    </p>
                  )}
                </div>
                {link && (
                  <div className="mt-4 pt-3 border-t border-stone-100">
                    <Link href={link.href} className="text-xs font-black text-[#D97706] hover:underline">
                      {link.label}
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Container>
    );

    if (isWood) {
      if (noBackground) {
        return (
          <section id={`section-${section.id}`} className="py-14 sm:py-20 border-none">
            {inner}
          </section>
        );
      }
      return (
        <WoodBackground id={`section-${section.id}`} className="py-14 sm:py-20 border-none">
          {inner}
        </WoodBackground>
      );
    }

    return (
      <section id={`section-${section.id}`} className="py-14 sm:py-20 bg-stone-50">
        {inner}
      </section>
    );
  }

  // 7. ARTISAN_HERITAGE (heritage-default)
  if (type === 'ARTISAN_HERITAGE' || template === 'heritage-default') {
    return (
      <div id={`section-${section.id}`}>
        <ArtisanHeritageShowcase />
      </div>
    );
  }

  // 8. HONEY_FINDER (honey-finder-default)
  if (type === 'HONEY_FINDER' || template === 'honey-finder-default') {
    if (!products || products.length === 0) return null;
    return (
      <div id={`section-${section.id}`}>
        <HoneyFinder products={products} />
      </div>
    );
  }

  // 9. TESTIMONIALS (testimonials-default)
  if (type === 'TESTIMONIALS' || template === 'testimonials-default') {
    return (
      <div id={`section-${section.id}`}>
        <TestimonialsSection />
      </div>
    );
  }

  // 10. FAQ_SECTION (faq-default)
  if (type === 'FAQ_SECTION' || template === 'faq-default') {
    return (
      <div id={`section-${section.id}`}>
        <FaqSection />
      </div>
    );
  }

  return null;
}
