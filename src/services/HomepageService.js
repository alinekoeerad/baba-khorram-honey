/**
 * Homepage Service Layer
 * Encapsulates domain logic, content sanitization, fallback defaults, and transformations
 */

import { homepageRepository } from '../repositories/HomepageRepository.js';

export class HomepageService {
  constructor(repository = homepageRepository) {
    this.repository = repository;
  }

  /**
   * Sanitizes string against XSS injection
   * @param {string} str 
   * @returns {string}
   */
  escapeHTML(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Loads and normalizes complete homepage content
   * Guarantees non-null structures so no missing field breaks UI
   * @returns {Promise<import('../types').HomepageData>}
   */
  async loadHomepage() {
    try {
      const data = await this.repository.getHomepageData();
      
      // Ensure robust defaults for all sections
      const normalizedData = {
        seo: {
          metaTitle: data?.seo?.metaTitle || 'شورای ملی عسل | مرجع رسمی عسل طبیعی',
          metaDescription: data?.seo?.metaDescription || 'پایگاه رسمی شورای ملی عسل',
          canonicalUrl: data?.seo?.canonicalUrl || 'https://honey.ir/',
          ogTitle: data?.seo?.ogTitle || data?.seo?.metaTitle || '',
          ogDescription: data?.seo?.ogDescription || data?.seo?.metaDescription || '',
          ogImage: data?.seo?.ogImage || 'images/hero-1.jpg',
          ogType: data?.seo?.ogType || 'website',
          twitterCard: data?.seo?.twitterCard || 'summary_large_image',
          keywords: data?.seo?.keywords || [],
          locale: data?.seo?.locale || 'fa_IR',
          siteName: data?.seo?.siteName || 'شورای ملی عسل'
        },
        settings: {
          siteNameFa: data?.settings?.siteNameFa || 'شورای ملی عسل®',
          siteNameEn: data?.settings?.siteNameEn || 'National Honey Board',
          tagline: data?.settings?.tagline || '',
          copyrightText: data?.settings?.copyrightText || '© ۲۰۲۶ شورای ملی عسل. کلیه حقوق محفوظ است.',
          language: 'fa',
          direction: 'rtl',
          contactEmail: data?.settings?.contactEmail || 'info@honey.ir'
        },
        utilityNav: {
          buttonLabel: data?.utilityNav?.buttonLabel || 'صنعت و همکاران تجاری',
          items: Array.isArray(data?.utilityNav?.items) ? data.utilityNav.items : []
        },
        navigation: Array.isArray(data?.navigation) ? data.navigation : [],
        hero: {
          id: data?.hero?.id || 'hero',
          title: data?.hero?.title || 'شاهکار بی‌نظیر طبیعت',
          subtitle: data?.hero?.subtitle || '',
          images: Array.isArray(data?.hero?.images) && data.hero.images.length > 0 
            ? data.hero.images 
            : ['images/hero-1.jpg'],
          isActive: data?.hero?.isActive !== false
        },
        beekeeping: {
          id: data?.beekeeping?.id || 'beekeeping',
          badge: data?.beekeeping?.badge || '',
          title: data?.beekeeping?.title || 'تجلیل از صنعت زنبورداری',
          body: data?.beekeeping?.body || '',
          image: data?.beekeeping?.image || 'images/beekeeping.jpg',
          imageAlt: data?.beekeeping?.imageAlt || 'زنبوردار در مزرعه آفتابی',
          ctaButton: data?.beekeeping?.ctaButton || { label: 'کسب اطلاعات بیشتر', href: '#' }
        },
        banner: {
          id: data?.banner?.id || 'banner',
          subtitle: data?.banner?.subtitle || 'با افتخار',
          title: data?.banner?.title || 'کارِ زنبورها',
          backgroundImage: data?.banner?.backgroundImage || 'images/bees-banner.jpg',
          ctaButton: data?.banner?.ctaButton || { label: 'مشاهده زنبورها', href: '#' }
        },
        versatility: {
          id: data?.versatility?.id || 'versatility',
          kicker: data?.versatility?.kicker || 'تنها ماده‌ای که از عهده',
          title: data?.versatility?.title || 'هر کاری برمی‌آید',
          body: data?.versatility?.body || '',
          primaryImage: data?.versatility?.primaryImage || 'images/honey-jar.jpg',
          primaryImageAlt: data?.versatility?.primaryImageAlt || 'ظرف شیشه‌ای عسل طلایی',
          decorativeImage: data?.versatility?.decorativeImage || 'images/figure-image-right@2x.png',
          ctaButton: data?.versatility?.ctaButton || { label: 'شناخت بیشتر عسل', href: '#' }
        },
        recipes: {
          id: data?.recipes?.id || 'recipes',
          title: data?.recipes?.title || 'دستور پخت‌های منتخب',
          recipes: Array.isArray(data?.recipes?.recipes) ? data.recipes.recipes : [],
          allRecipesCta: data?.recipes?.allRecipesCta || { label: 'مشاهده تمام دستور پخت‌ها', href: '#' }
        },
        blog: {
          id: data?.blog?.id || 'blog',
          tag: data?.blog?.tag || 'وبلاگ (THE BLOG)',
          title: data?.blog?.title || 'ماه ملی عسل (HONEY MONTH)',
          excerpt: data?.blog?.excerpt || '',
          image: data?.blog?.image || 'images/blog-honey.jpg',
          imageAlt: data?.blog?.imageAlt || 'تصویر ماه عسل',
          ctaButton: data?.blog?.ctaButton || { label: 'ادامه مطلب', href: '#' }
        },
        footer: {
          brandLogo: data?.footer?.brandLogo || 'images/homepage-footer-logo@2x.png',
          brandTitle: data?.footer?.brandTitle || 'شورای ملی عسل',
          primaryNav: Array.isArray(data?.footer?.primaryNav) ? data.footer.primaryNav : [],
          linkGroups: Array.isArray(data?.footer?.linkGroups) ? data.footer.linkGroups : [],
          socialLinks: Array.isArray(data?.footer?.socialLinks) ? data.footer.socialLinks : [],
          copyright: data?.footer?.copyright || '© ۲۰۲۶ شورای ملی عسل.'
        },
        cookieBanner: {
          title: data?.cookieBanner?.title || 'قوانین کوکی‌ها',
          message: data?.cookieBanner?.message || '',
          acceptLabel: data?.cookieBanner?.acceptLabel || 'موافقم',
          declineLabel: data?.cookieBanner?.declineLabel || 'عدم موافقت',
          policyHref: data?.cookieBanner?.policyHref || 'privacy.html'
        }
      };

      return normalizedData;
    } catch (err) {
      console.error('HomepageService: Critical error during data normalization', err);
      throw err;
    }
  }

  /**
   * Retrieves featured recipes sorted by order
   * @returns {Promise<import('../types').Recipe[]>}
   */
  async getFeaturedRecipes() {
    const data = await this.loadHomepage();
    return data.recipes.recipes.sort((a, b) => (a.order || 0) - (b.order || 0));
  }
}

export const homepageService = new HomepageService();
export default homepageService;
