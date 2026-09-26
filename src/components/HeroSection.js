/**
 * Hero Section Component (LCP Priority Optimized, Visual Match with honey.com)
 */

import { getPlaceholderSVG } from './UIHelpers.js';

export function renderHeroSection(hero) {
  if (!hero || hero.isActive === false) return '';

  const title = hero.title || 'شاهکار بی‌نظیر<br>طبیعت';
  const subtitle = hero.subtitle || '';
  const heroImg = (hero.images && hero.images[0]) || 'images/hero-1.jpg';
  const fallbackSvg = getPlaceholderSVG('شاهکار بی‌نظیر طبیعت', 1600, 700, '%233F2414');

  return `
    <section class="hero-section" aria-labelledby="hero-heading">
      <div class="hero-background-wrapper">
        <img 
          src="${heroImg}" 
          alt="شهد زرین و کوهستان‌های سرسبز زنبورداری" 
          class="hero-bg-image" 
          fetchpriority="high"
          decoding="async"
          width="1600"
          height="700"
          onerror="this.onerror=null; this.src='${fallbackSvg}';"
        >
      </div>

      <div class="hero-overlay" aria-hidden="true"></div>

      <div class="hero-content">
        <h1 id="hero-heading" class="hero-title">${title}</h1>
        ${subtitle ? `<p class="hero-sub">${subtitle}</p>` : ''}
      </div>
    </section>
  `;
}
