/**
 * Application Controller & Bootstrapper (Production Audited)
 * Orchestrates Components, Data Services, Hero Multi-Image Slideshow,
 * Touch/Keyboard RTL Carousel with Dynamic Pagination Dots & Robust Cookie Consent
 */

import { homepageService } from './services/HomepageService.js';
import { renderHeader } from './components/Header.js';
import { renderHeroSection } from './components/HeroSection.js';
import { renderBeekeepingSection } from './components/BeekeepingSection.js';
import { renderBannerSection } from './components/BannerSection.js';
import { renderVersatilitySection } from './components/VersatilitySection.js';
import { renderRecipeSection } from './components/RecipeSection.js';
import { renderBlogSection } from './components/BlogSection.js';
import { renderFooter } from './components/Footer.js';
import { renderCookieBanner } from './components/CookieBanner.js';

// Global Consent Function available immediately
if (typeof window !== 'undefined') {
  window.handleCookieConsent = function(choice) {
    try {
      if (window.localStorage) {
        window.localStorage.setItem('nhb_cookie_consent', choice);
      }
    } catch (e) {
      console.warn('LocalStorage unavailable for cookie consent:', e);
    }
    window.__nhb_cookie_consent = choice;
    if (document.documentElement) {
      document.documentElement.classList.add('cookie-consented');
    }
    const banner = document.getElementById('cookieBanner');
    if (banner) {
      banner.style.display = 'none';
      banner.style.pointerEvents = 'none';
      banner.classList.add('hidden');
      banner.setAttribute('aria-hidden', 'true');
    }
  };

  window.toggleUtilityMenu = function(e) {
    if (e) e.stopPropagation();
    const btn = document.getElementById('utilityBtn');
    const menu = document.getElementById('utilityMenu');
    if (!btn || !menu) return;
    const isOpen = !menu.classList.contains('show');
    menu.classList.toggle('show', isOpen);
    btn.classList.toggle('open', isOpen);
    btn.setAttribute('aria-expanded', String(isOpen));
  };
}

class App {
  constructor() {
    this.service = homepageService;
    this.data = null;
    this.carouselState = {
      currentIndex: 0,
      totalCards: 6,
      autoInterval: null,
      autoDirection: 1,
      isPaused: false
    };
    this.heroInterval = null;
  }

  async init() {
    // 1. Initialize cookie consent immediately & independently on raw DOM if present
    this.initCookieConsent();

    try {
      this.data = await this.service.loadHomepage();
      this.render();
      this.bindEvents();
      this.initHeroSlideshow();
      this.initCarousel();
      this.injectStructuredData();
      // Re-bind cookie consent after render
      this.initCookieConsent();
    } catch (error) {
      console.error('App initialization failed:', error);
      this.handleGlobalError(error);
      this.initCookieConsent();
    }
  }

  render() {
    const root = document.getElementById('app-root');
    if (!root) return;

    // Header begins at Y=0 (with overlay Utility Bar), followed by main content, footer & cookie banner
    root.innerHTML = `
      ${renderHeader(this.data.settings, this.data.navigation, this.data.utilityNav)}
      <main id="main-content" role="main" tabindex="-1">
        ${renderHeroSection(this.data.hero)}
        ${renderBeekeepingSection(this.data.beekeeping)}
        ${renderBannerSection(this.data.banner)}
        ${renderVersatilitySection(this.data.versatility)}
        ${renderRecipeSection(this.data.recipes)}
        ${renderBlogSection(this.data.blog)}
      </main>
      ${renderFooter(this.data.footer)}
      ${renderCookieBanner(this.data.cookieBanner)}
    `;
  }

  bindEvents() {
    // 1. Utility Dropdown (with Keyboard Accessibility & Click Outside)
    try {
      const utilityBtn = document.getElementById('utilityBtn');
      const utilityMenu = document.getElementById('utilityMenu');

      if (utilityBtn && utilityMenu) {
        utilityBtn.onclick = (e) => {
          if (window.toggleUtilityMenu) {
            window.toggleUtilityMenu(e);
          }
        };

        // Close on Escape or click outside
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && utilityMenu.classList.contains('show')) {
            utilityMenu.classList.remove('show');
            utilityBtn.classList.remove('open');
            utilityBtn.setAttribute('aria-expanded', 'false');
            utilityBtn.focus();
          }
        });

        document.addEventListener('click', (e) => {
          if (!utilityBtn.contains(e.target) && !utilityMenu.contains(e.target)) {
            utilityMenu.classList.remove('show');
            utilityBtn.classList.remove('open');
            utilityBtn.setAttribute('aria-expanded', 'false');
          }
        });
      }
    } catch (e) {
      console.warn('Utility menu init issue:', e);
    }

    // 2. Search Drawer Toggle
    try {
      const searchBtn = document.getElementById('searchToggleBtn');
      const searchDrawer = document.getElementById('searchDrawer');
      const searchInput = document.getElementById('searchInput');

      if (searchBtn && searchDrawer) {
        searchBtn.addEventListener('click', () => {
          const isExpanded = searchBtn.getAttribute('aria-expanded') === 'true';
          const nextState = !isExpanded;
          searchBtn.setAttribute('aria-expanded', String(nextState));
          searchDrawer.classList.toggle('show', nextState);
          searchDrawer.setAttribute('aria-hidden', String(!nextState));
          if (nextState && searchInput) {
            setTimeout(() => searchInput.focus(), 150);
          }
        });

        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && searchDrawer.classList.contains('show')) {
            searchDrawer.classList.remove('show');
            searchDrawer.setAttribute('aria-hidden', 'true');
            searchBtn.setAttribute('aria-expanded', 'false');
            searchBtn.focus();
          }
        });
      }
    } catch (e) {
      console.warn('Search toggle init issue:', e);
    }

    // 3. Mobile Navigation Drawer
    try {
      const mobileBtn = document.getElementById('mobileMenuBtn');
      const mobileDrawer = document.getElementById('mobileNavDrawer');

      if (mobileBtn && mobileDrawer) {
        mobileBtn.addEventListener('click', () => {
          const isOpen = mobileDrawer.classList.toggle('open');
          mobileBtn.setAttribute('aria-expanded', String(isOpen));
          if (isOpen) {
            mobileDrawer.removeAttribute('hidden');
          } else {
            mobileDrawer.setAttribute('hidden', '');
          }
        });
      }
    } catch (e) {
      console.warn('Mobile menu init issue:', e);
    }
  }

  /**
   * Hero Slideshow Controller (Crossfading multi-images calmly every 6 seconds)
   */
  initHeroSlideshow() {
    try {
      const images = document.querySelectorAll('.hero-bg-image');
      if (!images || images.length <= 1) return;

      if (this.heroInterval) clearInterval(this.heroInterval);

      this.heroInterval = setInterval(() => {
        const imgs = document.querySelectorAll('.hero-bg-image');
        if (!imgs || imgs.length <= 1) return;
        let activeIdx = Array.from(imgs).findIndex(img => img.classList.contains('active'));
        if (activeIdx === -1) activeIdx = 0;
        imgs[activeIdx].classList.remove('active');
        const nextIdx = (activeIdx + 1) % imgs.length;
        imgs[nextIdx].classList.add('active');
      }, 5000);
    } catch (err) {
      console.warn('Hero slideshow init error:', err);
    }
  }

  /**
   * Independent, resilient cookie consent handler with full try/catch
   */
  initCookieConsent() {
    try {
      const banner = document.getElementById('cookieBanner');
      if (!banner) return;

      let storedConsent = null;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          storedConsent = window.localStorage.getItem('nhb_cookie_consent');
        }
      } catch (e) {
        storedConsent = window.__nhb_cookie_consent || null;
      }

      if (!storedConsent && typeof window !== 'undefined' && window.__nhb_cookie_consent) {
        storedConsent = window.__nhb_cookie_consent;
      }

      const hideBanner = () => {
        banner.style.display = 'none';
        banner.style.pointerEvents = 'none';
        banner.classList.add('hidden');
        banner.setAttribute('aria-hidden', 'true');
        if (document.documentElement) {
          document.documentElement.classList.add('cookie-consented');
        }
      };

      if (storedConsent === 'accepted' || storedConsent === 'declined') {
        hideBanner();
        return;
      }

      // Show banner if no consent
      banner.style.display = 'flex';
      banner.style.pointerEvents = 'auto';
      banner.classList.remove('hidden');
      banner.removeAttribute('aria-hidden');

      const acceptBtn = document.getElementById('acceptCookieBtn');
      const declineBtn = document.getElementById('declineCookieBtn');

      if (acceptBtn) {
        acceptBtn.onclick = (e) => {
          if (e) e.preventDefault();
          window.handleCookieConsent('accepted');
        };
      }

      if (declineBtn) {
        declineBtn.onclick = (e) => {
          if (e) e.preventDefault();
          window.handleCookieConsent('declined');
        };
      }
    } catch (globalCookieErr) {
      console.error('Cookie consent setup failed:', globalCookieErr);
    }
  }

  /**
   * Recipe Carousel with Pause on Hover & Dynamic Pagination
   */
  initCarousel() {
    const prevBtn = document.getElementById('carouselPrevBtn');
    const nextBtn = document.getElementById('carouselNextBtn');
    const container = document.getElementById('recipeCardsContainer');
    const wrapper = document.getElementById('recipesCarouselWrapper');
    const viewport = document.getElementById('carouselViewport');
    const dotsContainer = document.getElementById('carouselDots');

    if (!container || !wrapper) return;

    this.carouselState.totalCards = container.querySelectorAll('.recipe-card').length;

    const getVisibleCards = () => {
      const w = window.innerWidth;
      if (w < 640) return 1;
      if (w < 1024) return 2;
      if (w < 1366) return 3;
      return 4; // ~4 full cards + partial next card on large desktop
    };

    const getCardStep = () => {
      const firstCard = container.querySelector('.recipe-card');
      if (!firstCard) return 365;
      const cardWidth = firstCard.offsetWidth;
      const gap = 20;
      return cardWidth + gap;
    };

    const getMaxIndex = () => {
      return Math.max(0, this.carouselState.totalCards - getVisibleCards());
    };

    const renderDots = () => {
      if (!dotsContainer) return;
      dotsContainer.innerHTML = '';
      const maxIndex = getMaxIndex();
      const numDots = maxIndex + 1;
      if (numDots <= 1) return;

      for (let i = 0; i < numDots; i++) {
        const dot = document.createElement('button');
        dot.className = `carousel-dot ${i === this.carouselState.currentIndex ? 'active' : ''}`;
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', `رفتن به صفحه ${i + 1}`);
        dot.setAttribute('aria-selected', String(i === this.carouselState.currentIndex));
        dot.addEventListener('click', () => {
          this.carouselState.currentIndex = i;
          updatePosition();
        });
        dotsContainer.appendChild(dot);
      }
    };

    const updatePosition = () => {
      const maxIdx = getMaxIndex();
      if (this.carouselState.currentIndex > maxIdx) {
        this.carouselState.currentIndex = maxIdx;
      }
      if (this.carouselState.currentIndex < 0) {
        this.carouselState.currentIndex = 0;
      }

      const cardStep = getCardStep();
      const offset = this.carouselState.currentIndex * cardStep;

      // In Persian RTL layout, translating positively shifts cards along reading order
      container.style.transform = `translateX(${offset}px)`;

      // Update dots
      if (dotsContainer) {
        const dots = dotsContainer.querySelectorAll('.carousel-dot');
        dots.forEach((dot, idx) => {
          const isActive = idx === this.carouselState.currentIndex;
          dot.classList.toggle('active', isActive);
          dot.setAttribute('aria-selected', String(isActive));
        });
      }
    };

    const stepForward = () => {
      const maxIdx = getMaxIndex();
      if (this.carouselState.currentIndex >= maxIdx) {
        this.carouselState.currentIndex = 0;
      } else {
        this.carouselState.currentIndex += 1;
      }
      updatePosition();
    };

    const stepBackward = () => {
      const maxIdx = getMaxIndex();
      if (this.carouselState.currentIndex <= 0) {
        this.carouselState.currentIndex = maxIdx;
      } else {
        this.carouselState.currentIndex -= 1;
      }
      updatePosition();
    };

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        stepForward();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        stepBackward();
      });
    }

    // Touch Swipe for Mobile / Tablet
    let startX = 0;
    let isSwiping = false;

    if (viewport) {
      viewport.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isSwiping = true;
      }, { passive: true });

      viewport.addEventListener('touchend', (e) => {
        if (!isSwiping) return;
        const endX = e.changedTouches[0].clientX;
        const diffX = endX - startX;
        if (Math.abs(diffX) > 40) {
          // RTL swipe
          if (diffX > 0) {
            stepForward();
          } else {
            stepBackward();
          }
        }
        isSwiping = false;
      }, { passive: true });
    }

    // Autoplay Controller with Pause on Hover & Keyboard Focus
    const startAutoplay = () => {
      if (this.carouselState.autoInterval) clearInterval(this.carouselState.autoInterval);
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;

      this.carouselState.autoInterval = setInterval(() => {
        if (!this.carouselState.isPaused) {
          const maxIdx = getMaxIndex();
          if (this.carouselState.currentIndex >= maxIdx) {
            this.carouselState.currentIndex = 0;
          } else {
            this.carouselState.currentIndex += 1;
          }
          updatePosition();
        }
      }, 5000);
    };

    const pauseAutoplay = () => {
      this.carouselState.isPaused = true;
    };

    const resumeAutoplay = () => {
      this.carouselState.isPaused = false;
    };

    // Pause on Hover
    wrapper.addEventListener('mouseenter', pauseAutoplay);
    wrapper.addEventListener('mouseleave', resumeAutoplay);
    wrapper.addEventListener('focusin', pauseAutoplay);
    wrapper.addEventListener('focusout', resumeAutoplay);

    // Window Resize Observer for responsive re-calculation
    window.addEventListener('resize', () => {
      renderDots();
      updatePosition();
    });

    renderDots();
    updatePosition();
    startAutoplay();
  }

  injectStructuredData() {
    try {
      const existingScript = document.getElementById('schemaOrgJsonLd');
      if (existingScript) existingScript.remove();

      const script = document.createElement('script');
      script.id = 'schemaOrgJsonLd';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            '@id': 'https://honey.com/#organization',
            'name': this.data.settings.siteNameFa,
            'alternateName': this.data.settings.siteNameEn,
            'url': this.data.seo.canonicalUrl,
            'logo': `${this.data.seo.canonicalUrl}images/homepage-footer-logo@2x.png`,
            'description': this.data.seo.metaDescription,
            'sameAs': [
              'https://facebook.com',
              'https://instagram.com',
              'https://twitter.com',
              'https://youtube.com',
              'https://pinterest.com'
            ]
          },
          {
            '@type': 'WebSite',
            '@id': 'https://honey.com/#website',
            'url': this.data.seo.canonicalUrl,
            'name': this.data.settings.siteNameFa,
            'publisher': { '@id': 'https://honey.com/#organization' },
            'inLanguage': 'fa-IR'
          }
        ]
      });
      document.head.appendChild(script);
    } catch (e) {
      console.warn('Schema injection warning:', e);
    }
  }

  handleGlobalError(error) {
    console.error('Fatal initialization error:', error);
  }
}

// Bootstrap Application
const app = new App();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}

export default app;
