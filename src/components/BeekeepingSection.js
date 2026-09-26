/**
 * Beekeeping Feature Section Component (Feature 1 - Visual Match)
 */

import { renderPillButton, getPlaceholderSVG } from './UIHelpers.js';

export function renderBeekeepingSection(data) {
  if (!data) return '';

  const title = data.title || 'تجلیل از<br>صنعت زنبورداری';
  const body = data.body || '';
  const image = data.image || 'images/beekeeping.jpg';
  const imageAlt = data.imageAlt || 'زنبوردار در مزرعه آفتابی';
  const fallbackSvg = getPlaceholderSVG('صنعت زنبورداری', 800, 500);

  return `
    <section class="feature-beekeeping" aria-labelledby="beekeeping-heading">
      <div class="container feature-grid">
        <div class="feature-text-block">
          <h2 id="beekeeping-heading" class="section-tag-green">${title}</h2>
          <p class="feature-body">${body}</p>
          ${renderPillButton(data.ctaButton)}
        </div>
        <div class="feature-image-wrap">
          <img 
            src="${image}" 
            alt="${imageAlt}" 
            loading="lazy" 
            decoding="async" 
            width="600" 
            height="380"
            onerror="this.onerror=null; this.src='${fallbackSvg}';"
          >
        </div>
      </div>
    </section>
  `;
}
