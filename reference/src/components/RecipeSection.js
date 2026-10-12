/**
 * Recipe Carousel / Grid Section Component
 */

import { renderDottedArrow, renderPillButton, getPlaceholderSVG } from './UIHelpers.js';

export function renderRecipeSection(data) {
  if (!data) return '';

  const title = data.title || 'دستور پخت‌های منتخب';
  const recipes = data.recipes || [];

  const cardsHTML = recipes.map(recipe => {
    const fallbackSvg = getPlaceholderSVG(recipe.title, 400, 260);
    const colorClass = recipe.colorScheme || 'card-green';

    return `
      <article class="recipe-card ${colorClass}" data-recipe-id="${recipe.id}">
        <a href="${recipe.href}" class="recipe-card-clickable" aria-label="${recipe.title}">
          <div class="card-img-wrap">
            <img 
              src="${recipe.image}" 
              alt="${recipe.imageAlt || recipe.title}" 
              loading="lazy" 
              decoding="async" 
              width="360" 
              height="240"
              onerror="this.onerror=null; this.src='${fallbackSvg}';"
            >
          </div>
          <div class="card-content-wrap">
            <h3 class="recipe-card-title">${recipe.title}</h3>
            <div class="recipe-card-link">
              <span>${recipe.actionLabel || 'مشاهده دستور پخت'}</span>
              ${renderDottedArrow()}
            </div>
          </div>
        </a>
      </article>
    `;
  }).join('');

  return `
    <section class="recipes-section" aria-labelledby="recipes-heading">
      <div class="container">
        <div class="recipes-header">
          <h2 id="recipes-heading" class="recipes-section-title">${title}</h2>
        </div>

        <div 
          class="carousel-outer-wrapper" 
          id="recipesCarouselWrapper"
          role="region" 
          aria-roledescription="carousel" 
          aria-label="اسلایدر دستور پخت‌های منتخب"
        >
          <!-- RTL Prev Button (on the Right) -->
          <button 
            class="carousel-nav-btn carousel-nav-prev" 
            id="carouselPrevBtn" 
            aria-label="دستور پخت قبلی"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>

          <!-- Carousel Viewport -->
          <div class="carousel-viewport" id="carouselViewport">
            <div class="recipe-cards-container" id="recipeCardsContainer">
              ${cardsHTML}
            </div>
          </div>

          <!-- RTL Next Button (on the Left) -->
          <button 
            class="carousel-nav-btn carousel-nav-next" 
            id="carouselNextBtn" 
            aria-label="دستور پخت بعدی"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
        </div>

        <div class="recipes-footer-cta">
          ${renderPillButton(data.allRecipesCta)}
        </div>
      </div>
    </section>
  `;
}
