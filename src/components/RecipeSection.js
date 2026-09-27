/**
 * Recipe Carousel / Grid Section Component (Visual Match with honey.com)
 * Proportions:
 * - Card total height: ~595px (wide, vertically elongated)
 * - Card image height: ~445px (74-76% of total card height)
 * - Card content height: ~150px (24-26% of total card height)
 * - Sharp corners, simple arrows, pagination dots, image darkening on hover
 */

import { renderDottedArrow, renderPillButton, getPlaceholderSVG } from './UIHelpers.js';

export function renderRecipeSection(data) {
  if (!data) return '';

  const title = data.title || 'دستور پخت‌های منتخب';
  const recipes = data.recipes || [];

  const cardsHTML = recipes.map(recipe => {
    const fallbackSvg = getPlaceholderSVG(recipe.title, 420, 450);
    const colorClass = recipe.colorScheme || 'card-mantis1';

    return `
      <article class="recipe-card ${colorClass}" data-recipe-id="${recipe.id}">
        <a href="${recipe.href}" class="recipe-card-clickable" aria-label="${recipe.title}">
          <div class="card-img-wrap">
            <img 
              src="${recipe.image}" 
              alt="${recipe.imageAlt || recipe.title}" 
              loading="lazy" 
              decoding="async" 
              width="355" 
              height="445"
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
      <div class="container-wide">
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
          <!-- Left Control (Physical Left Side) - points LEFT -->
          <button 
            class="carousel-nav-btn carousel-nav-left" 
            id="carouselLeftBtn" 
            aria-label="دستور پخت بعدی"
            onclick="handleRecipeCarouselLeft(event)"
          >
            <svg class="carousel-arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          <!-- Carousel Viewport -->
          <div class="carousel-viewport" id="carouselViewport">
            <div class="recipe-cards-container" id="recipeCardsContainer">
              ${cardsHTML}
            </div>
          </div>

          <!-- Right Control (Physical Right Side) - points RIGHT -->
          <button 
            class="carousel-nav-btn carousel-nav-right" 
            id="carouselRightBtn" 
            aria-label="دستور پخت قبلی"
            onclick="handleRecipeCarouselRight(event)"
          >
            <svg class="carousel-arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>

        <!-- Recipe Carousel Pagination Dots -->
        <div class="carousel-dots" id="carouselDots" role="tablist" aria-label="انتخاب صفحه دستور پخت"></div>

        <div class="recipes-footer-cta">
          ${renderPillButton(data.allRecipesCta)}
        </div>
      </div>
    </section>
  `;
}
