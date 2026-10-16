/**
 * Public Homepage (Exact Polish matching honey.com & Fully Dynamic from CMS)
 *
 * Implements:
 * 1. Dynamic database section rendering via DynamicSectionRenderer when active sections exist in CMS.
 * 2. Seamless fallback to canonical homepage sections when CMS database sections are not yet populated.
 * 3. Consecutive WOOD background sections merge seamlessly via WoodGroup without borders or seams.
 */

import React from 'react';
import Link from 'next/link';
import { PillButton } from '@/components/ui/pill-button';
import { WoodBackground } from '@/components/ui/wood-background';
import { WoodGroup } from '@/components/ui/wood-group';
import { Container } from '@/components/ui/container';
import { HeroSlider } from '@/components/public/hero-slider';
import { RecipeCarousel } from '@/components/public/recipe-carousel';
import { ProductCarousel } from '@/components/public/product-carousel';
import { DynamicSectionRenderer } from '@/components/public/dynamic-section-renderer';
import { ArtisanHeritageShowcase } from '@/components/public/artisan-heritage-showcase';
import { HoneyFinder } from '@/components/public/honey-finder';
import { TestimonialsSection } from '@/components/public/testimonials-section';
import { FaqSection } from '@/components/public/faq-section';
import { getPublicHomepageSections } from '@/server/queries/homepage-sections';
import { getPublicProducts } from '@/server/queries/products';
import { getPublicRecipes } from '@/server/queries/recipes';

export const revalidate = 3600;

// Canonical fallback recipes matching reference/index.html & site-content.json
const CANONICAL_RECIPES = [
  {
    id: 'rec-1',
    title: 'اسموتی خنک بلوبری، مرکبات و عسل',
    slug: 'blueberry-citrus-honey-smoothie',
    imageUrl: '/images/recipe-1.jpg',
    theme: 'green' as const,
  },
  {
    id: 'rec-2',
    title: 'گرانیتای هندوانه و عسل با موم طبیعی',
    slug: 'watermelon-honey-granita',
    imageUrl: '/images/recipe-2.jpg',
    theme: 'orange' as const,
  },
  {
    id: 'rec-3',
    title: 'بستنی عسلی نمکی با کباب میوه‌های گریل‌شده',
    slug: 'salted-honey-ice-cream-grilled-fruit',
    imageUrl: '/images/recipe-3.jpg',
    theme: 'yellow' as const,
  },
  {
    id: 'rec-4',
    title: 'پای ماست بستنی میوه‌ای با شهد عسل',
    slug: 'frozen-yogurt-honey-berry-pie',
    imageUrl: '/images/recipe-4.jpg',
    theme: 'burgundy' as const,
  },
  {
    id: 'rec-5',
    title: 'کیک خانگی لایه‌ای با شهد عسل کوهی',
    slug: 'mountain-honey-layer-cake',
    imageUrl: '/images/recipe-5.jpg',
    theme: 'green' as const,
  },
  {
    id: 'rec-6',
    title: 'نوشیدنی آرامش‌بخش عسل، لیمو و زنجبیل',
    slug: 'soothing-honey-lemon-ginger-tea',
    imageUrl: '/images/recipe-6.jpg',
    theme: 'orange' as const,
  },
];

// Canonical fallback products
const CANONICAL_PRODUCTS = [
  {
    id: 'prod-1',
    nameFa: 'عسل طبیعی گون کوهستان',
    slug: 'mountain-astragalus-honey',
    imageUrl: '/images/honey-jar.jpg',
    theme: 'yellow' as const,
    isAvailable: true,
  },
  {
    id: 'prod-2',
    nameFa: 'عسل وحشی کنار (سدر) جنوب',
    slug: 'wild-sidr-honey',
    imageUrl: '/images/honey-jar.jpg',
    theme: 'orange' as const,
    isAvailable: true,
  },
  {
    id: 'prod-3',
    nameFa: 'عسل آویشن وحشی البرز',
    slug: 'wild-thyme-honey',
    imageUrl: '/images/honey-jar.jpg',
    theme: 'green' as const,
    isAvailable: true,
  },
  {
    id: 'prod-4',
    nameFa: 'عسل چهل‌گیاه ییلاقی ارسباران',
    slug: 'multifloral-mountain-honey',
    imageUrl: '/images/honey-jar.jpg',
    theme: 'burgundy' as const,
    isAvailable: true,
  },
];

export default async function HomePage() {
  let dbSections: any[] = [];
  let dbProducts: any[] = [];
  let dbRecipes: any[] = [];

  try {
    dbSections = await getPublicHomepageSections();
  } catch {
    dbSections = [];
  }

  try {
    const productsRes = await getPublicProducts({ take: 12 });
    dbProducts = productsRes.products || productsRes.items || (Array.isArray(productsRes) ? productsRes : []);
  } catch {
    dbProducts = [];
  }

  try {
    const recipesRes = await getPublicRecipes({ take: 12 });
    dbRecipes = recipesRes.recipes || recipesRes.items || (Array.isArray(recipesRes) ? recipesRes : []);
  } catch {
    dbRecipes = [];
  }

  const displayProducts = dbProducts.length > 0 ? dbProducts : CANONICAL_PRODUCTS;
  const displayRecipes = dbRecipes.length >= 4 ? dbRecipes : CANONICAL_RECIPES;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://babakhorram.com';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: 'عسل باباخُرم',
        url: siteUrl,
        logo: `${siteUrl}/images/footer-logo.webp`,
        description: 'تولید و عرضه مستقیم انواع عسل طبیعی و ارگانیک با برگه آزمایش ساکارز',
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'IR',
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: 'عسل باباخُرم',
        publisher: {
          '@id': `${siteUrl}/#organization`,
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: `${siteUrl}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  // If active CMS database sections exist, render them dynamically
  if (dbSections.length > 0) {
    // Group consecutive sections by background === 'WOOD' for seamless merging
    const groupedSections: Array<{ isWood: boolean; sections: any[] }> = [];
    dbSections.forEach((sec) => {
      const isWood = sec.background === 'WOOD';
      const lastGroup = groupedSections[groupedSections.length - 1];
      if (lastGroup && lastGroup.isWood === isWood) {
        lastGroup.sections.push(sec);
      } else {
        groupedSections.push({ isWood, sections: [sec] });
      }
    });

    return (
      <div className="flex flex-col w-full overflow-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {groupedSections.map((group, gIdx) => {
          if (group.isWood) {
            return (
              <WoodGroup key={`wood-group-${gIdx}`}>
                {group.sections.map((section) => (
                  <DynamicSectionRenderer
                    key={section.id}
                    section={section}
                    products={displayProducts}
                    recipes={displayRecipes}
                    noBackground={true}
                  />
                ))}
              </WoodGroup>
            );
          }
          return group.sections.map((section) => (
            <DynamicSectionRenderer
              key={section.id}
              section={section}
              products={displayProducts}
              recipes={displayRecipes}
            />
          ));
        })}
      </div>
    );
  }

  // Canonical Fallback Rendering
  return (
    <div className="flex flex-col w-full overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* 1. Hero Section (Slideshow with Blur-Fade & Ken Burns Zoom, NO buttons, NO dots) */}
      <HeroSlider />

      {/* 2. Feature 1: Beekeeping (Static image, NO hover zoom animation, NO white frame/border) */}
      <section className="py-14 sm:py-20 lg:py-24 bg-white" aria-labelledby="beekeeping-heading">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-14 items-center">
            {/* Text block (7 cols) */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-right">
              <h2
                id="beekeeping-heading"
                className="text-2xl sm:text-4xl lg:text-5xl font-black text-[#2E6930] leading-tight tracking-tight"
              >
                تجلیل از صنعت زنبورداری
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-[#332115] leading-loose text-justify font-bold">
                شورای ملی عسل متعهد به اشتراک‌گذاری داستان‌های الهام‌بخش زنبورداران و تولیدکنندگان عسل از سراسر جهان است؛ با تأکید ویژه بر تأثیر شگرف و مثبتی که صنعت زنبورداری بر توسعه جوامع محلی، سلامت محیط‌زیست و تضمین امنیت چرخه غذایی ما بر جای می‌گذارد.
              </p>
              <div className="pt-2">
                <PillButton variant="green" size="lg" href="/products">
                  کسب اطلاعات بیشتر
                </PillButton>
              </div>
            </div>

            {/* Image block (5 cols) */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md lg:max-w-none overflow-hidden rounded-none shadow-md">
                <img
                  src="/images/hero/feature-honey.jpg"
                  alt="عسل اصیل و طبیعی باباخُرم"
                  className="w-full h-auto object-cover"
                  loading="lazy"
                  width={600}
                  height={380}
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 3. Feature Showcase: Artisan Heritage & High-Altitude Beekeeping (SEC-05) */}
      <ArtisanHeritageShowcase />

      {/* 4. Feature 3: Versatility of Honey */}
      <section className="py-14 sm:py-20 lg:py-28 bg-white overflow-hidden" aria-labelledby="versatility-heading">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12 lg:gap-16 items-center">
            {/* Visual Swapped Image (5 cols) */}
            <div className="lg:col-span-5 flex justify-center relative">
              <div className="relative w-64 sm:w-80 lg:w-88 flex items-center justify-center">
                <img
                  src="/images/blog-honey.jpg"
                  alt="ظروف شیشه‌ای زیبا، موم زنبور و عسل طلایی در سینی چوبی سنتی"
                  className="w-full h-auto object-contain drop-shadow-2xl z-10"
                  loading="lazy"
                  width={420}
                  height={420}
                />
                <img
                  src="/images/figure-image-right@2x.png"
                  alt=""
                  aria-hidden="true"
                  className="absolute -bottom-4 left-0 sm:-left-6 w-24 sm:w-36 h-auto opacity-90 z-20 pointer-events-none"
                  loading="lazy"
                  width={140}
                  height={140}
                />
              </div>
            </div>

            {/* Text Wrap (7 cols) */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-5 text-right">
              <div className="text-amber-500 flex items-center gap-2" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
              </div>
              <div className="text-lg sm:text-2xl font-black text-[#382A20]">
                تنها ماده‌ای که از عهده
              </div>
              <h2
                id="versatility-heading"
                className="text-2xl sm:text-4xl lg:text-6xl font-black text-[#C86A00] leading-tight sm:leading-none"
              >
                هر کاری برمی‌آید
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-[#332115] leading-loose text-justify font-bold">
                عسل یک دستورالعمل تک‌مؤلفه‌ای و شگفت‌انگیز است که مستقیماً توسط زنبورها، شکوفه‌های گل و خودِ مادر طبیعت خلق شده است؛ بدون افزودنی، بدون دخالت مصنوعی و سرشار از آنتی‌اکسیدان‌ها و مواد معدنی حیاتی.
              </p>
              <div className="pt-2">
                <PillButton variant="gold" size="lg" href="/products">
                  شناخت بیشتر عسل
                </PillButton>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 5. Interactive Honey Finder Widget (SEC-04) */}
      <HoneyFinder products={displayProducts} />

      {/* 
        Consecutive Wood Sections (6, 7, 8):
        Seamless merging via WoodGroup with no seams or duplicate backgrounds!
      */}
      <WoodGroup>
        {/* 6. Recipe Showcase */}
        <RecipeCarousel recipes={displayRecipes as any} noBackground={true} />

        {/* 7. Products Showcase */}
        <ProductCarousel products={displayProducts as any} noBackground={true} />

        {/* 8. Blog Section: Honey Month with Warm Ivory / Gold Contrast */}
        <section className="py-14 sm:py-20 lg:py-28 border-none overflow-hidden" aria-labelledby="blog-heading">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 items-center">
              {/* Circular Framed Image */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-56 h-56 sm:w-80 sm:h-80 lg:w-92 lg:h-92 rounded-full overflow-hidden border-4 sm:border-8 border-white shadow-2xl">
                  <img
                    src="/images/honey-jar.jpg"
                    alt="شیشه عسل طبیعی کهربایی شفاف با قاشق چوبی مخصوص عسل"
                    className="w-full h-full object-cover object-center rounded-full"
                    loading="lazy"
                    width={350}
                    height={350}
                  />
                </div>
              </div>

              {/* Text Wrap with High Contrast Warm Ivory & Amber */}
              <div className="lg:col-span-7 space-y-4 sm:space-y-6 text-right">
                <div className="text-xs sm:text-base font-black text-[#F59E0B] tracking-widest uppercase drop-shadow-md">
                  وبلاگ و دانستنی‌ها
                </div>
                <h2
                  id="blog-heading"
                  className="text-2xl sm:text-4xl lg:text-5xl font-black text-[#FFFBEB] leading-tight drop-shadow-lg"
                >
                  ماه ملی عسل (HONEY MONTH)
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-[#E5D5C5] font-medium leading-loose text-justify">
                  چه می‌شد اگر شیرین‌کننده دلخواه شما، چیزی فراتر از صرفاً یک ماده شیرین بود؟ عسل با خود شیرینی اصیل، طعمی متمایز و بافتی بی‌همتا را به قلب آشپزخانه شما می‌آورد؛ و این فقط آغاز یک سفر خوش‌طعم است. در این ماه ملی عسل، تمامی دلایل فوق‌العاده برای حضور عسل در پخت‌وپز روزمره را با هم جشن می‌گیریم.
                </p>
                <div className="pt-2">
                  <PillButton variant="gold" size="lg" href="/recipes">
                    مطالعه مقالات و دستورها
                  </PillButton>
                </div>
              </div>
            </div>
          </Container>
        </section>
      </WoodGroup>

      {/* 9. Customer Reviews & Social Proof Testimonials (SEC-03) */}
      <TestimonialsSection />

      {/* 10. Honey FAQ Accordion Section (SEC-02) */}
      <FaqSection />
    </div>
  );
}
