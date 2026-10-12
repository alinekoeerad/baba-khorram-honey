/**
 * Multi-Tiered Footer Component
 */

export function renderFooter(data) {
  if (!data) return '';

  const primaryNavHTML = (data.primaryNav || []).map(link => `
    <a href="${link.href}" class="footer-primary-link">${link.label}</a>
  `).join('');

  const linkGroupsHTML = (data.linkGroups || []).map(group => `
    <div class="footer-group-item">
      <span class="footer-group-title">${group.groupTitle}</span>
      <div class="footer-sublinks-wrap">
        ${(group.links || []).map(l => `<a href="${l.href}">${l.label}</a>`).join('')}
      </div>
    </div>
  `).join('');

  const socialIconsMap = {
    facebook: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>`,
    instagram: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`,
    pinterest: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0a12 12 0 0 0-4.37 23.18c-.05-.98-.1-2.48.02-3.55l.86-3.66s-.22-.44-.22-1.09c0-1.02.59-1.78 1.33-1.78.63 0 .93.47.93 1.04 0 .63-.4 1.58-.61 2.45-.17.73.37 1.33 1.09 1.33 1.3 0 2.31-1.38 2.31-3.37 0-1.76-1.27-2.99-3.08-2.99-2.09 0-3.32 1.57-3.32 3.19 0 .63.24 1.31.55 1.68.06.07.07.13.05.21l-.21.84c-.03.14-.11.17-.25.1-1-.46-1.63-1.92-1.63-3.09 0-2.51 1.83-4.82 5.27-4.82 2.77 0 4.92 1.97 4.92 4.61 0 2.75-1.73 4.97-4.14 4.97-.81 0-1.57-.42-1.83-.92l-.5 1.9c-.18.7-.67 1.57-1 2.1A12 12 0 1 0 12 0z"/></svg>`,
    twitter: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
    linkedin: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>`,
    youtube: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`
  };

  const socialLinksHTML = (data.socialLinks || []).map(s => `
    <a 
      href="${s.href}" 
      target="_blank" 
      rel="noopener noreferrer" 
      class="social-icon" 
      aria-label="${s.label}"
      title="${s.label}"
    >
      ${socialIconsMap[s.platform] || `<i class="${s.iconClass}"></i>`}
    </a>
  `).join('');

  const logoImg = data.brandLogo || 'images/homepage-footer-logo@2x.png';

  return `
    <footer class="site-footer" role="contentinfo">
      <div class="container">
        <!-- Row 1: Primary Navigation -->
        <nav class="footer-primary-nav" aria-label="پیوندهای اصلی فوتر">
          ${primaryNavHTML}
        </nav>

        <!-- Row 2: Categorized Link Groups -->
        <div class="footer-sections-row">
          ${linkGroupsHTML}
        </div>

        <!-- Row 3: Logo, Social Icons, and Copyright -->
        <div class="footer-bottom-row">
          <div class="footer-brand">
            <img 
              src="${logoImg}" 
              alt="${data.brandTitle || 'شورای ملی عسل'}" 
              class="footer-logo-img"
              loading="lazy" 
              decoding="async" 
              width="180" 
              height="48"
              onerror="this.onerror=null; this.src='data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22180%22%20height%3D%2248%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ctext%20fill%3D%22%23FBBF24%22%20font-family%3D%22sans-serif%22%20font-size%3D%2216%22%20font-weight%3D%22bold%22%20x%3D%2210%22%20y%3D%2230%22%3E%D8%B4%D9%88%D8%B1%D8%A7%DB%8C%20%D9%85%D9%84%DB%8C%20%D8%B9%D8%B3%D9%84%3C%2Ftext%3E%3C%2Fsvg%3E';"
            >
          </div>

          <div class="social-links" aria-label="شبکه‌های اجتماعی">
            ${socialLinksHTML}
          </div>

          <p class="footer-copyright">
            ${data.copyright}
          </p>
        </div>
      </div>
    </footer>
  `;
}
