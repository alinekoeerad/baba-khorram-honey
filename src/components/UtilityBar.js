/**
 * Utility Bar Component
 * Displays industry & partners dropdown navigation hanging down at the physical top-right edge of the header
 */

import { renderDottedArrow } from './UIHelpers.js';

export function renderUtilityBar(utilityNav) {
  if (!utilityNav) return '';
  const buttonLabel = utilityNav.buttonLabel || 'صنعت و همکاران تجاری';
  const items = utilityNav.items || [];

  const listItemsHTML = items.map(item => `
    <li role="none">
      <a href="${item.href}" class="utility-menu-link" role="menuitem">
        <span class="utility-item-text">${item.label}</span>
        <span class="utility-hover-indicator" aria-hidden="true">${renderDottedArrow()}</span>
      </a>
    </li>
  `).join('');

  return `
    <div class="utility-wrapper" role="region" aria-label="ناوبری صنعت و همکاران">
      <div class="dropdown-wrapper">
        <button 
          class="utility-btn" 
          id="utilityBtn" 
          onclick="toggleUtilityMenu(event)"
          aria-haspopup="true" 
          aria-expanded="false" 
          aria-controls="utilityMenu"
        >
          <span>${buttonLabel}</span>
          <svg class="utility-caret" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        <ul class="utility-dropdown-menu" id="utilityMenu" role="menu">
          ${listItemsHTML}
        </ul>
      </div>
    </div>
  `;
}
