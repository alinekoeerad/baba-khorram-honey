/**
 * Cookie Consent Banner Component
 */

export function renderCookieBanner(data) {
  if (!data) return '';

  return `
    <div 
      class="cookie-banner" 
      id="cookieBanner" 
      role="dialog" 
      aria-live="polite" 
      aria-label="${data.title || 'حریم خصوصی و کوکی‌ها'}"
    >
      <div class="cookie-text">
        <strong>${data.title}:</strong> ${data.message}
        ${data.policyHref ? `<a href="${data.policyHref}" style="text-decoration: underline; color: var(--honey-dark); margin-right: 6px;">بیشتر بدانید</a>` : ''}
      </div>
      <div class="cookie-actions">
        <button type="button" class="btn-consent" id="acceptCookieBtn">${data.acceptLabel || 'موافقم'}</button>
        <button type="button" class="btn-decline" id="declineCookieBtn">${data.declineLabel || 'عدم موافقت'}</button>
      </div>
    </div>
  `;
}
