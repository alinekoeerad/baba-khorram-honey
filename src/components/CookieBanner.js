/**
 * Cookie Consent Banner Component
 * Robust, accessible, and self-contained
 */

export function renderCookieBanner(data) {
  if (!data) return '';

  let isConsented = false;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const consent = window.localStorage.getItem('nhb_cookie_consent');
      if (consent === 'accepted' || consent === 'declined' || window.__nhb_cookie_consent) {
        isConsented = true;
      }
    }
  } catch (e) {
    if (typeof window !== 'undefined' && window.__nhb_cookie_consent) {
      isConsented = true;
    }
  }

  const hiddenAttr = isConsented ? 'aria-hidden="true" style="display: none; pointer-events: none;"' : '';
  const hiddenClass = isConsented ? 'hidden' : '';

  return `
    <div 
      class="cookie-banner ${hiddenClass}" 
      id="cookieBanner" 
      role="dialog" 
      aria-live="polite" 
      ${hiddenAttr}
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
