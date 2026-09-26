/**
 * Made by Bees Banner Section Component (Feature 2 - Visual Match)
 * Reconstructed with large scale and strong visual presence matching honey.com
 */

import { renderPillButton } from './UIHelpers.js';

export function renderBannerSection(data) {
  if (!data) return '';

  const subtitle = data.subtitle || 'با افتخار';
  const title = data.title || 'کارِ زنبورها';

  return `
    <section class="banner-made-by-bees" aria-labelledby="banner-heading">
      <div class="banner-content">
        <div class="banner-subtitle">${subtitle}</div>
        <h2 id="banner-heading" class="banner-title">${title}</h2>
        ${renderPillButton(data.ctaButton)}
      </div>
    </section>
  `;
}
