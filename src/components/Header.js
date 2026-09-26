/**
 * Header Component (Visual Match with honey.com)
 * Layout:
 * - Physical Left: National Honey Board Logo
 * - Center / Main Area: Horizontal Navigation & Search
 * - Physical Top-Right: Independent Overlay Hanging "Industry & Partners" Control
 */

import { renderUtilityBar } from './UtilityBar.js';

export function renderHeader(settings, navigation, utilityNav = null) {
  const brandFa = settings?.siteNameFa || 'شورای ملی عسل®';
  const brandEn = settings?.siteNameEn || 'National Honey Board';
  const navItems = navigation || [];

  const navLinksHTML = navItems.map((item) => {
    const activeClass = item.isActive ? 'active' : '';
    const ariaCurrent = item.isActive ? 'aria-current="page"' : '';

    return `
      <li class="nav-item">
        <a href="${item.href}" class="nav-link ${activeClass}" ${ariaCurrent}>
          ${item.label}
        </a>
      </li>
    `;
  }).join('');

  const mobileNavLinksHTML = navItems.map(item => {
    const activeClass = item.isActive ? 'active' : '';
    return `
      <li>
        <a href="${item.href}" class="${activeClass}">
          ${item.label}
        </a>
      </li>
    `;
  }).join('');

  const mobileUtilityHTML = utilityNav && utilityNav.items ? `
    <div class="mobile-utility-section">
      <div class="mobile-utility-title">${utilityNav.buttonLabel || 'صنعت و همکاران تجاری'}</div>
      <ul class="mobile-utility-list">
        ${utilityNav.items.map(u => `<li><a href="${u.href}">${u.label}</a></li>`).join('')}
      </ul>
    </div>
  ` : '';

  return `
    <header class="main-header" role="banner">
      <!-- 1. Main Header Layout (Starts at Y=0, spans header width) -->
      <div class="header-inner container-wide">
        <!-- Physical Left: National Honey Board Logo -->
        <a href="index.html" class="brand-logo" aria-label="${brandFa} - ${brandEn}">
          <img 
            src="images/homepage-footer-logo@2x.png" 
            alt="${brandFa}" 
            class="brand-logo-img" 
            width="175" 
            height="56"
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
          >
          <div class="brand-title-wrap">
            <span class="brand-name">${brandFa}</span>
            <span class="brand-subtitle">${brandEn}</span>
          </div>
        </a>

        <!-- Center / Main Area: Navigation Links & Search Icon -->
        <nav class="desktop-nav" aria-label="منوی اصلی">
          <ul class="nav-menu">
            ${navLinksHTML}
            <li class="nav-item nav-item-search">
              <button 
                class="search-btn" 
                id="searchToggleBtn" 
                aria-label="باز کردن جستجو" 
                aria-expanded="false" 
                aria-controls="searchDrawer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
            </li>
          </ul>
        </nav>

        <!-- Right Side Reserved Space (Ensures overlay never collides with nav) -->
        <div class="header-right-spacer" aria-hidden="true"></div>

        <!-- Mobile Menu Toggle Button -->
        <button 
          class="mobile-menu-btn" 
          id="mobileMenuBtn" 
          aria-label="منوی موبایل" 
          aria-expanded="false" 
          aria-controls="mobileNavDrawer"
        >
          <svg id="hamburgerIcon" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- 2. Independent Hanging Overlay: Industry & Partners (Physical Top-Right Edge) -->
      ${utilityNav ? renderUtilityBar(utilityNav) : ''}

      <!-- Expandable Search Drawer -->
      <div class="search-drawer" id="searchDrawer" role="search" aria-hidden="true">
        <form id="searchForm" action="recipes.html" method="GET">
          <input 
            type="search" 
            name="q" 
            id="searchInput" 
            placeholder="جستجو در میان دستور پخت‌ها، مقالات و انواع عسل طبیعی..." 
            aria-label="جستجو در سایت"
            autocomplete="off"
            required
          >
          <button type="submit">جستجو</button>
        </form>
      </div>

      <!-- Mobile Navigation Drawer -->
      <nav class="mobile-nav-drawer" id="mobileNavDrawer" aria-label="منوی موبایل" hidden>
        <ul class="mobile-nav-list">
          ${mobileNavLinksHTML}
        </ul>
        ${mobileUtilityHTML}
      </nav>
    </header>
  `;
}
