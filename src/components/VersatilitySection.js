/**
 * Versatility of Honey Section Component (Feature 3 - Visual Match)
 * Dedicated reconstruction: large honey jar, balanced typography, and correctly positioned decorative icon
 */

import { renderPillButton, getPlaceholderSVG } from './UIHelpers.js';

export function renderVersatilitySection(data) {
  if (!data) return '';

  const kicker = data.kicker || 'تنها ماده‌ای که از عهده';
  const title = data.title || 'هر کاری برمی‌آید';
  const body = data.body || '';
  const primaryImg = data.primaryImage || 'images/honey-jar.jpg';
  const primaryAlt = data.primaryImageAlt || 'ظرف شیشه‌ای عسل طلایی';
  const decorImg = data.decorativeImage || 'images/figure-image-right@2x.png';
  const fallbackSvg = getPlaceholderSVG('عسل خالص طبیعی', 520, 520);

  return `
    <section class="feature-versatility" aria-labelledby="versatility-heading">
      <div class="container versatility-grid">
        <!-- Visual Anchor: Large Honey Jar (dominant on one side) -->
        <div class="versatility-image-wrap">
          <img 
            src="${primaryImg}" 
            alt="${primaryAlt}" 
            class="primary-jar"
            loading="lazy" 
            decoding="async" 
            width="500" 
            height="500"
            onerror="this.onerror=null; this.src='${fallbackSvg}';"
          >
        </div>

        <!-- Content & Decorative Elements -->
        <div class="versatility-text-wrap">
          <div class="versatility-header-area">
            <div class="versatility-kicker-wrap">
              <span class="versatility-kicker">${kicker}</span>
              <h2 id="versatility-heading" class="versatility-headline">${title}</h2>
            </div>
            <!-- Decorative Bee/Honey Figure positioned in the upper area -->
            <img 
              src="${decorImg}" 
              alt="" 
              class="versatility-decorative-figure"
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              width="135"
              height="135"
              onerror="this.style.display='none';"
            >
          </div>

          <p class="versatility-body">${body}</p>
          ${renderPillButton(data.ctaButton)}
        </div>
      </div>
    </section>
  `;
}
