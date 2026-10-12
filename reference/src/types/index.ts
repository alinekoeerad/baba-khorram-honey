/**
 * CMS-Ready Domain Models and TypeScript Interfaces
 * Persian Honey Board Website (شورای ملی عسل)
 * 
 * These interfaces decouple presentation from content and reflect database entities
 * ready for future Admin Panel / Headless CMS integration.
 */

export interface SEOSettings {
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogType: 'website' | 'article';
  twitterCard: 'summary_large_image' | 'summary';
  keywords: string[];
  locale: string;
  siteName: string;
}

export interface SiteSettings {
  siteNameFa: string;
  siteNameEn: string;
  tagline: string;
  copyrightText: string;
  language: 'fa';
  direction: 'rtl';
  contactEmail: string;
  contactPhone?: string;
  address?: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  target?: '_self' | '_blank';
  isActive?: boolean;
  order: number;
}

export interface UtilityNavItem {
  id: string;
  label: string;
  href: string;
  order: number;
}

export interface CTAButton {
  label: string;
  href: string;
  variant?: 'green' | 'gold' | 'orange' | 'yellow';
  ariaLabel?: string;
}

export interface HeroSectionData {
  id: string;
  title: string;
  subtitle: string;
  images: string[];
  ctaButton?: CTAButton;
  isActive: boolean;
}

export interface FeatureBeekeepingData {
  id: string;
  badge?: string;
  title: string;
  body: string;
  image: string;
  imageAlt: string;
  ctaButton: CTAButton;
}

export interface BannerSectionData {
  id: string;
  subtitle: string;
  title: string;
  backgroundImage: string;
  ctaButton: CTAButton;
}

export interface VersatilitySectionData {
  id: string;
  kicker: string;
  title: string;
  body: string;
  primaryImage: string;
  primaryImageAlt: string;
  decorativeImage?: string;
  ctaButton: CTAButton;
}

export type RecipeCardColor = 'card-green' | 'card-orange' | 'card-yellow' | 'card-burgundy';

export interface Recipe {
  id: string;
  title: string;
  slug: string;
  image: string;
  imageAlt: string;
  colorScheme: RecipeCardColor;
  actionLabel: string;
  href: string;
  order: number;
  featured?: boolean;
}

export interface RecipeSectionData {
  id: string;
  title?: string;
  recipes: Recipe[];
  allRecipesCta: CTAButton;
}

export interface BlogPost {
  id: string;
  tag: string;
  title: string;
  excerpt: string;
  image: string;
  imageAlt: string;
  author?: string;
  publishedAt?: string;
  ctaButton: CTAButton;
}

export interface SocialLink {
  platform: 'facebook' | 'instagram' | 'pinterest' | 'twitter' | 'linkedin' | 'youtube';
  label: string;
  href: string;
  iconClass: string;
}

export interface FooterLinkGroup {
  id: string;
  groupTitle: string;
  links: NavigationItem[];
}

export interface FooterData {
  primaryNav: NavigationItem[];
  linkGroups: FooterLinkGroup[];
  brandLogo: string;
  brandTitle: string;
  socialLinks: SocialLink[];
  copyright: string;
}

export interface CookieBannerData {
  title: string;
  message: string;
  acceptLabel: string;
  declineLabel: string;
  policyHref?: string;
}

export interface HomepageData {
  seo: SEOSettings;
  settings: SiteSettings;
  utilityNav: {
    buttonLabel: string;
    items: UtilityNavItem[];
  };
  navigation: NavigationItem[];
  hero: HeroSectionData;
  beekeeping: FeatureBeekeepingData;
  banner: BannerSectionData;
  versatility: VersatilitySectionData;
  recipes: RecipeSectionData;
  blog: BlogPost;
  footer: FooterData;
  cookieBanner: CookieBannerData;
}
