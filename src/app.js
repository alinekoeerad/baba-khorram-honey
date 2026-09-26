/**
 * Application Controller & Bootstrapper (Production Audited)
 * Orchestrates Components, Data Services, Touch/Keyboard Interactions, and Dynamic RTL Carousel with Pagination Dots
 */

import { homepageService } from './services/HomepageService.js';
import { renderUtilityBar } from './components/UtilityBar.js';
import { renderHeader } from './components/Header.js';
import { renderHeroSection } from './components/HeroSection.js';
import { renderBeekeepingSection } from './components/BeekeepingSection.js';
import { renderBannerSection } from './components/BannerSection.js';
import { renderVersatilitySection } from './components/VersatilitySection.js';
import { renderRecipeSection } from './components/RecipeSection.js';
import { renderBlogSection } from './components/BlogSection.js';
import { renderFooter } from './components/Footer.js';
import { renderCookieBanner } from './components/CookieBanner.js';

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
  }

  async init() {
    try {
      this.data = await this.service.loadHomepage();
      this.render();
      this.bindEvents();
      this.initCarousel();
      this.injectStructuredData();
    } catch (error) {
      console.error('App initialization failed:', error);
      this.handleGlobalError(error);
    }
  }

  render() {
    const root = document.getElementById('app-root');
    if (!root) return;

    // Render modular components into page structure
    root.innerHTML = `
      ${renderUtilityBar(this.data.utilityNav)}
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
    const utilityBtn = document.getElementById('utilityBtn');
    const utilityMenu = document.getElementById('utilityMenu');

    if (utilityBtn && utilityMenu) {
      const toggleMenu = (open) => {
        const isOpen = open !== undefined ? open : !utilityMenu.classList.contains('show');
        utilityMenu.classList.toggle('show', isOpen);
        utilityBtn.classList.toggle('open', isOpen);
        utilityBtn.setAttribute('aria-expanded', String(isOpen));
      };

      utilityBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu();
      });

      document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown-wrapper')) {
          toggleMenu(false);
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && utilityMenu.classList.contains('show')) {
          toggleMenu(false);
          utilityBtn.focus();
        }
      });
    }

    // 2. Search Drawer (with Focus Management)
    const searchToggleBtn = document.getElementById('searchToggleBtn');
    const searchDrawer = document.getElementById('searchDrawer');
    const searchInput = document.getElementById('searchInput');

    if (searchToggleBtn && searchDrawer) {
      const toggleSearch = (open) => {
        const isOpen = open !== undefined ? open : !searchDrawer.classList.contains('show');
        searchDrawer.classList.toggle('show', isOpen);
        searchToggleBtn.setAttribute('aria-expanded', String(isOpen));
        searchDrawer.setAttribute('aria-hidden', String(!isOpen));
        if (isOpen && searchInput) {
          setTimeout(() => searchInput.focus(), 120);
        }
      };

      searchToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSearch();
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchDrawer.classList.contains('show')) {
          toggleSearch(false);
          searchToggleBtn.focus();
        }
      });
    }

    // 3. Mobile Navigation Drawer (with Accessible Hamburger Morph)
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileNavDrawer = document.getElementById('mobileNavDrawer');
    const hamburgerIcon = document.getElementById('hamburgerIcon');

    if (mobileMenuBtn && mobileNavDrawer) {
      mobileMenuBtn.addEventListener('click', () => {
        const isOpen = mobileNavDrawer.classList.toggle('open');
        mobileNavDrawer.hidden = !isOpen;
        mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));

        if (hamburgerIcon) {
          if (isOpen) {
            hamburgerIcon.innerHTML = `
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            `;
          } else {
            hamburgerIcon.innerHTML = `
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            `;
          }
        }
      });
    }

    // 4. Cookie Consent Persistence
    const cookieBanner = document.getElementById('cookieBanner');
    const acceptCookieBtn = document.getElementById('acceptCookieBtn');
    const declineCookieBtn = document.getElementById('declineCookieBtn');

    if (cookieBanner) {
      if (localStorage.getItem('nhb_cookie_consent')) {
        cookieBanner.style.display = 'none';
      }

      if (acceptCookieBtn) {
        acceptCookieBtn.addEventListener('click', () => {
          localStorage.setItem('nhb_cookie_consent', 'accepted');
          cookieBanner.style.display = 'none';
        });
      }

      if (declineCookieBtn) {
        declineCookieBtn.addEventListener('click', () => {
          localStorage.setItem('nhb_cookie_consent', 'declined');
          cookieBanner.style.display = 'none';
        });
      }
    }
  }

  initCarousel() {
    const prevBtn = document.getElementById('carouselPrevBtn');
    const nextBtn = document.getElementById('carouselNextBtn');
    const container = document.getElementById('recipeCardsContainer');
    const wrapper = document.getElementById('recipesCarouselWrapper');
    const viewport = document.getElementById('carouselViewport');
    const dotsContainer = document.getElementById('carouselDots');

    if (!container || !wrapper) return;

    this.carouselState.totalCards = container.querySelectorAll('.recipe-card').length;

    // Dynamically measure step size to support any viewport and padding perfectly
    const getCardStep = () => {
      const card = container.querySelector('.recipe-card');
      if (!card) return 344;
      const style = window.getComputedStyle(container);
      const gap = parseFloat(style.gap) || 24;
      return card.offsetWidth + gap;
    };

    const getVisibleCardsCount = () => {
      if (!viewport) return 3;
      const step = getCardStep();
      return Math.max(1, Math.round(viewport.offsetWidth / step));
    };

    const getMaxSlides = () => {
      const visible = getVisibleCardsCount();
      return Math.max(0, this.carouselState.totalCards - visible);
    };

    const updateDots = () => {
      if (!dotsContainer) return;
      const dots = dotsContainer.querySelectorAll('.carousel-dot');
      dots.forEach((dot, idx) => {
        const isActive = idx === this.carouselState.currentIndex;
        dot.classList.toggle('active', isActive);
        dot.setAttribute('aria-selected', String(isActive));
      });
    };

    const renderDots = () => {
      if (!dotsContainer) return;
      const maxSlides = getMaxSlides();
      const totalPages = maxSlides + 1;
      dotsContainer.innerHTML = '';
      for (let i = 0; i < totalPages; i++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = `carousel-dot ${i === this.carouselState.currentIndex ? 'active' : ''}`;
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', `صفحه ${i + 1}`);
        dot.setAttribute('aria-selected', String(i === this.carouselState.currentIndex));
        dot.addEventListener('click', () => {
          this.carouselState.currentIndex = i;
          updatePosition();
        });
        dotsContainer.appendChild(dot);
      }
    };

    const updatePosition = () => {
      // In RTL: positive translateX moves items rightward, revealing subsequent items from the left
      const step = getCardStep();
      const offset = this.carouselState.currentIndex * step;
      container.style.transform = `translateX(${offset}px)`;
      updateDots();
    };

    const slide = (dir) => {
      const maxSlides = getMaxSlides();
      this.carouselState.currentIndex += dir;
      if (this.carouselState.currentIndex < 0) this.carouselState.currentIndex = 0;
      if (this.carouselState.currentIndex > maxSlides) this.carouselState.currentIndex = maxSlides;
      updatePosition();
    };

    if (prevBtn) {
      prevBtn.addEventListener('click', () => slide(-1));
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => slide(1));
    }

    // Auto-advance every 4.5 seconds
    const startAutoPlay = () => {
      if (!this.carouselState.autoInterval) {
        this.carouselState.autoInterval = setInterval(() => {
          if (this.carouselState.isPaused) return;
          const maxSlides = getMaxSlides();
          this.carouselState.currentIndex += this.carouselState.autoDirection;
          if (this.carouselState.currentIndex >= maxSlides) {
            this.carouselState.autoDirection = -1;
          } else if (this.carouselState.currentIndex <= 0) {
            this.carouselState.autoDirection = 1;
          }
          updatePosition();
        }, 4500);
      }
    };

    const pauseAutoPlay = () => {
      if (this.carouselState.autoInterval) {
        clearInterval(this.carouselState.autoInterval);
        this.carouselState.autoInterval = null;
      }
    };

    // Pause on hover anywhere over cards or carousel wrapper
    wrapper.addEventListener('mouseenter', pauseAutoPlay);
    wrapper.addEventListener('mouseleave', startAutoPlay);
    wrapper.addEventListener('focusin', pauseAutoPlay);
    wrapper.addEventListener('focusout', startAutoPlay);

    // Keyboard Navigation for accessibility (Arrow keys)
    wrapper.setAttribute('tabindex', '0');
    wrapper.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        // In RTL, ArrowLeft navigates forward / next
        e.preventDefault();
        slide(1);
      } else if (e.key === 'ArrowRight') {
        // In RTL, ArrowRight navigates backward / prev
        e.preventDefault();
        slide(-1);
      }
    });

    // Touch Swipe Support for Mobile/Tablet
    let touchStartX = 0;
    wrapper.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    wrapper.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const diffX = touchEndX - touchStartX;
      if (Math.abs(diffX) > 40) {
        // In RTL, swiping right (diffX > 0) moves next, swiping left (diffX < 0) moves prev
        if (diffX > 0) {
          slide(1);
        } else {
          slide(-1);
        }
      }
    }, { passive: true });

    // Responsive window resize recalculation
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const maxSlides = getMaxSlides();
        if (this.carouselState.currentIndex > maxSlides) {
          this.carouselState.currentIndex = maxSlides;
        }
        renderDots();
        updatePosition();
      }, 150);
    });

    renderDots();
    startAutoPlay();
  }

  injectStructuredData() {
    if (!this.data) return;

    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": `${this.data.seo.canonicalUrl}#website`,
          "url": this.data.seo.canonicalUrl,
          "name": this.data.settings.siteNameFa,
          "description": this.data.seo.metaDescription,
          "inLanguage": "fa-IR"
        },
        {
          "@type": "Organization",
          "@id": `${this.data.seo.canonicalUrl}#organization`,
          "name": this.data.settings.siteNameFa,
          "alternateName": this.data.settings.siteNameEn,
          "url": this.data.seo.canonicalUrl,
          "logo": `${this.data.seo.canonicalUrl}${this.data.footer.brandLogo}`,
          "sameAs": (this.data.footer.socialLinks || []).map(s => s.href)
        },
        {
          "@type": "ItemList",
          "name": this.data.recipes.title,
          "itemListElement": (this.data.recipes.recipes || []).map((recipe, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "item": {
              "@type": "Recipe",
              "name": recipe.title,
              "image": `${this.data.seo.canonicalUrl}${recipe.image}`,
              "url": `${this.data.seo.canonicalUrl}${recipe.href}`
            }
          }))
        }
      ]
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);
  }

  handleGlobalError(error) {
    const root = document.getElementById('app-root');
    if (root) {
      root.innerHTML = `
        <div style="padding: 40px; text-align: center; direction: rtl; font-family: sans-serif;">
          <h2 style="color: #C86A00;">متأسفانه در بارگذاری صفحه اصلی مشکلی رخ داده است</h2>
          <p style="margin-top: 10px; color: #5C5248;">لطفاً صفحه را مجدداً بارگذاری فرمایید.</p>
          <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 24px; background: #332115; color: #FFF; border: none; border-radius: 4px; cursor: pointer;">بارگذاری مجدد</button>
        </div>
      `;
    }
  }
}

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
