/**
 * Cookie Consent Banner Component (GDPR Reference Aligned & Resilient)
 * Features immediate inline click delegation, zero-flash state persistence,
 * and authentic Honey.com GDPR category options.
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

  const hiddenAttr = isConsented ? 'aria-hidden="true" style="display: none !important; pointer-events: none !important;"' : '';
  const hiddenClass = isConsented ? 'hidden' : '';

  return `
    <div 
      class="cookie-banner ${hiddenClass}" 
      id="cookieBanner" 
      role="dialog" 
      aria-live="polite" 
      ${hiddenAttr}
      aria-label="${data.title || 'مقررات عمومی حفاظت از داده‌ها (GDPR)'}"
    >
      <div class="cookie-content-wrapper">
        <div class="cookie-header-title">
          <strong>${data.title || 'مقررات عمومی حفاظت از داده‌ها (GDPR)'}</strong>
        </div>
        <p class="cookie-text">
          ${data.message || 'ما از کوکی‌ها برای مدیریت و نگهداری وب‌سایت استفاده می‌کنیم. کوکی‌ها فایل‌های کوچکی هستند که برای شناسایی مرورگر اینترنت، ذخیره تنظیمات برگزیده و احراز هویت نشست‌های کاربری بر روی رایانه شما قرار می‌گیرند. در صورت موافقت با قرار دادن کوکی‌ها، روی «موافقم» کلیک کنید و در غیر این صورت «عدم موافقت» را انتخاب نمایید.'}
        </p>
        <div class="cookie-categories" aria-label="دسته‌بندی‌های کوکی">
          <label class="cookie-cat-item">
            <input type="checkbox" checked disabled>
            <span>ضروری (Necessary)</span>
          </label>
          <label class="cookie-cat-item">
            <input type="checkbox" checked id="prefCookies">
            <span>ترجیحات (Preferences)</span>
          </label>
          <label class="cookie-cat-item">
            <input type="checkbox" checked id="statCookies">
            <span>آمار (Statistics)</span>
          </label>
          <label class="cookie-cat-item">
            <input type="checkbox" id="mktCookies">
            <span>بازاریابی (Marketing)</span>
          </label>
        </div>
      </div>
      <div class="cookie-actions">
        <button 
          type="button" 
          class="btn-consent" 
          id="acceptCookieBtn"
          onclick="if(window.handleCookieConsent) { window.handleCookieConsent('accepted'); } else { localStorage.setItem('nhb_cookie_consent','accepted'); document.getElementById('cookieBanner').style.display='none'; }"
        >
          ${data.acceptLabel || 'موافقم (I Consent)'}
        </button>
        <button 
          type="button" 
          class="btn-decline" 
          id="declineCookieBtn"
          onclick="if(window.handleCookieConsent) { window.handleCookieConsent('declined'); } else { localStorage.setItem('nhb_cookie_consent','declined'); document.getElementById('cookieBanner').style.display='none'; }"
        >
          ${data.declineLabel || 'عدم موافقت (I Do Not Consent)'}
        </button>
      </div>
    </div>
  `;
}
