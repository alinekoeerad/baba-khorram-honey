/**
 * Blog / Educational Section Component (Honey Month - Visual Match with honey.com)
 * Reconstructed: softer lighter wood background, clean circular crop without white ring or hover animation
 */

import { renderPillButton, getPlaceholderSVG } from './UIHelpers.js';

export function renderBlogSection(data) {
  if (!data) return '';

  const tag = data.tag || 'وبلاگ (THE BLOG)';
  const title = data.title || 'ماه ملی<br>عسل';
  const excerpt = data.excerpt || '';
  const image = data.image || 'images/blog-honey.jpg';
  const imageAlt = data.imageAlt || 'ظروف شیشه‌ای عسل در سینی چوبی';
  const fallbackSvg = getPlaceholderSVG('ماه ملی عسل', 500, 500);

  return `
    <section class="blog-section" aria-labelledby="blog-heading">
      <div class="container blog-grid">
        <div class="blog-image-wrap">
          <!-- Clean Circular Crop - No white border, no artificial animations -->
          <div class="circular-frame">
            <img 
              src="${image}" 
              alt="${imageAlt}" 
              loading="lazy" 
              decoding="async" 
              width="380" 
              height="380"
              onerror="this.onerror=null; this.src='${fallbackSvg}';"
            >
          </div>
        </div>

        <div class="blog-text-wrap">
          <div class="blog-tag">${tag}</div>
          <h2 id="blog-heading" class="blog-title">${title}</h2>
          <p class="blog-excerpt">${excerpt}</p>
          ${renderPillButton(data.ctaButton)}
        </div>
      </div>
    </section>
  `;
}
