/**
 * Shared UI Helper Functions & SVG Icons (Visual Match with honey.com)
 */

/**
 * Renders the authentic Honey.com Dotted Arrow SVG (pointing left for RTL: ◀ · · ·)
 * @returns {string} SVG HTML string
 */
export function renderDottedArrow() {
  return `
    <svg class="honey-arrow-svg" viewBox="0 0 28 12" aria-hidden="true" focusable="false">
      <path d="M8 2 L2 6 L8 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <circle cx="14" cy="6" r="1.5" />
      <circle cx="20" cy="6" r="1.5" />
      <circle cx="26" cy="6" r="1.5" />
    </svg>
  `;
}

/**
 * Renders a Honey Pill Button
 * @param {import('../types').CTAButton} btn 
 * @returns {string}
 */
export function renderPillButton(btn) {
  if (!btn || !btn.label) return '';
  const variantClass = btn.variant ? `pill-btn-${btn.variant}` : 'pill-btn-sunglow';
  const aria = btn.ariaLabel ? `aria-label="${btn.ariaLabel}"` : '';
  return `
    <a href="${btn.href || '#'}" class="pill-btn ${variantClass}" ${aria}>
      <span>${btn.label}</span>
      ${renderDottedArrow()}
    </a>
  `;
}

/**
 * Returns inline data-URI SVG placeholder to prevent broken layout if local image is missing
 * @param {string} text 
 * @param {number} width 
 * @param {number} height 
 * @param {string} bg 
 * @returns {string}
 */
export function getPlaceholderSVG(text, width = 600, height = 400, bg = '%23FAF7F2') {
  return `data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22${width}%22%20height%3D%22${height}%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20${width}%20${height}%22%3E%3Crect%20fill%3D%22${bg}%22%20width%3D%22100%25%22%20height%3D%22100%25%22%2F%3E%3Ctext%20fill%3D%22%233F2414%22%20font-family%3D%22sans-serif%22%20font-size%3D%2220%22%20font-weight%3D%22bold%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3E${encodeURIComponent(text)}%3C%2Ftext%3E%3C%2Fsvg%3E`;
}
