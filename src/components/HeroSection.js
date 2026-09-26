/**
 * Hero Section Component (LCP Priority Optimized, Multi-Image Slideshow Support)
 */

import { getPlaceholderSVG } from './UIHelpers.js';

export function renderHeroSection(hero) {
  if (!hero || hero.isActive === false) return '';

  const title = hero.title || 'شاهکار بی‌نظیر<br>طبیعت';
  const subtitle = hero.subtitle || '';
  const images = (hero.images && hero.images.length > 0) ? hero.images : ['images/hero-1.jpg'];
  const fallbackSvg = getPlaceholderSVG('شاهکار بی‌نظیر طبیعت', 1600, 700, '%233F2414');

  const slidesHTML = images.map((imgSrc, idx) => `
    <img 
      src="${imgSrc}" 
      alt="شهد زرین و کوهستان‌های سرسبز زنبورداری" 
      class="hero-bg-image ${idx === 0 ? 'active' : ''}" 
      ${idx === 0 ? 'fetchpriority="high"' : 'loading="lazy"'}
      decoding="async"
      width="1600"
      height="700"
      data-slide-index="${idx}"
      onerror="this.onerror=null; this.src='${fallbackSvg}';"
    >
  `).join('');

  return `
    <section class="hero-section" aria-labelledby="hero-heading">
      <div class="hero-background-wrapper" id="heroBgWrapper">
        ${slidesHTML}
      </div>

      <div class="hero-overlay" aria-hidden="true"></div>

      <div class="hero-content">
        <h1 id="hero-heading" class="hero-title">${title}</h1>
        ${subtitle ? `<p class="hero-sub">${subtitle}</p>` : ''}
      </div>
    </section>
  `;
}
