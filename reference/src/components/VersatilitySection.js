/**
 * Versatility of Honey Section Component (Feature 3)
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
  const fallbackSvg = getPlaceholderSVG('عسل خالص طبیعی', 500, 500);

  return `
    <section class="feature-versatility" aria-labelledby="versatility-heading">
      <div class="container versatility-grid">
        <div class="versatility-image-wrap">
          <img 
            src="${primaryImg}" 
            alt="${primaryAlt}" 
            class="primary-jar"
            loading="lazy" 
            decoding="async" 
            width="420" 
            height="420"
            onerror="this.onerror=null; this.src='${fallbackSvg}';"
          >
          <img 
            src="${decorImg}" 
            alt="" 
            class="versatility-decorative-figure"
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            width="140"
            height="140"
            onerror="this.style.display='none';"
          >
        </div>

        <div class="versatility-text-wrap">
          <div class="versatility-badge-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
            </svg>
          </div>
          <div class="versatility-kicker">${kicker}</div>
          <h2 id="versatility-heading" class="versatility-headline">${title}</h2>
          <p class="versatility-body">${body}</p>
          ${renderPillButton(data.ctaButton)}
        </div>
      </div>
    </section>
  `;
}
