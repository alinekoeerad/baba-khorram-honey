/**
 * Clipboard & Client Platform Helpers
 *
 * Provides resilient clipboard copy with an off-screen <textarea> fallback
 * that operates safely over insecure HTTP local network LAN IPs (e.g. http://192.168.x.x:3000),
 * as well as cross-platform iOS vs Android SMS URI builders, safe client UUID generator,
 * and environment-aware origin resolution.
 */

/**
 * Synchronous clipboard copy helper using a temporary <textarea> and document.execCommand('copy').
 * Preserves the active user-gesture context on mobile/desktop and functions safely over
 * insecure HTTP local-network testing (e.g. http://192.168.x.x:3000) and restricted webviews.
 */
export function copyTextSync(text: string): boolean {
  if (!text || typeof document === 'undefined') return false;

  let textarea: HTMLTextAreaElement | null = null;
  try {
    textarea = document.createElement('textarea');
    textarea.value = text;
    // Prevent mobile keyboard pop-up, zoom, and scroll jump
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.width = '2em';
    textarea.style.height = '2em';
    textarea.style.padding = '0';
    textarea.style.border = 'none';
    textarea.style.outline = 'none';
    textarea.style.boxShadow = 'none';
    textarea.style.background = 'transparent';
    textarea.style.opacity = '0';
    textarea.style.zIndex = '-9999';

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    const successful = document.execCommand('copy');
    return Boolean(successful);
  } catch {
    return false;
  } finally {
    if (textarea && textarea.parentNode) {
      textarea.parentNode.removeChild(textarea);
    }
  }
}

/**
 * Resilient clipboard copy helper for all environments (Dev & Prod).
 * 1. Tries modern navigator.clipboard.writeText(text) first.
 * 2. If it fails or is unavailable (e.g. local HTTP LAN testing or restricted
 *    in-app mobile webviews like Instagram/Telegram/Rubika in production),
 *    falls back to synchronous off-screen <textarea> + document.execCommand('copy') wrapped in try/catch.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // 1. Try modern navigator.clipboard.writeText first (HTTPS or localhost)
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Async failed or permissions blocked (insecure HTTP LAN or restricted in-app webview).
      // Fall back to synchronous execCommand below.
    }
  }

  // 2. Synchronous off-screen <textarea> + document.execCommand('copy') fallback wrapped in try/catch
  return copyTextSync(text);
}

/**
 * Safe client-side UUID generator.
 * In insecure contexts (like HTTP over local LAN IP http://192.168.x.x:3000), crypto.randomUUID
 * is not defined by modern browsers.
 * This guarantees a valid RFC4122 v4 UUID across all contexts without throwing.
 */
export function safeRandomUUID(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    try {
      return crypto.randomUUID();
    } catch {
      // Fall through to RFC4122 v4 math fallback
    }
  }

  // RFC4122 v4 compliant fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Resolves the dynamic client origin for QR codes, share URLs, and messenger links.
 *
 * Rules:
 * - In production (process.env.NODE_ENV === 'production'):
 *   Strictly uses the canonical process.env.NEXT_PUBLIC_SITE_URL (falling back to
 *   window.location.origin only if the env var is missing or contains 'localhost').
 * - In development (process.env.NODE_ENV !== 'production'):
 *   Uses window.location.origin so scanning a QR code on a phone over LAN
 *   (http://192.168.x.x:3000) or dev tunnel (*.trycloudflare.com) opens correctly on the phone.
 */
export function getClientOrigin(): string {
  const isProd = process.env.NODE_ENV === 'production';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (isProd && siteUrl) {
    const isLocalhost =
      siteUrl.includes('localhost') ||
      siteUrl.includes('127.0.0.1') ||
      siteUrl.startsWith('http://0.0.0.0');

    if (!isLocalhost) {
      return siteUrl.replace(/\/+$/, '');
    }
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return siteUrl ? siteUrl.replace(/\/+$/, '') : 'https://babakhorram.com';
}

/**
 * Resolves an order share URL for QR codes and sharing buttons.
 * Guarantees that whether given a full URL or a share code, the resulting URL
 * uses the safe resolved origin for dev LAN or canonical production.
 */
export function resolveOrderShareUrl(shareCodeOrUrl: string): string {
  if (!shareCodeOrUrl) return '';
  const origin = getClientOrigin();

  // If shareCodeOrUrl contains /o/<code...>, extract code
  const match = shareCodeOrUrl.match(/\/o\/([^/?#]+)/);
  if (match && match[1]) {
    return `${origin}/o/${match[1]}`;
  }

  // If it's just the clean code
  const cleanCode = shareCodeOrUrl.replace(/^\/o\//, '').trim();
  return `${origin}/o/${cleanCode}`;
}

/**
 * Detects whether the current browser is running on an iOS device (iPhone, iPad, iPod).
 */
export function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/i.test(navigator.userAgent);
}

/**
 * Builds a cross-platform SMS URI with pre-populated message body:
 * - iOS: sms:${phone}&body=${encodedText}
 * - Android & Standard: sms:${phone}?body=${encodedText}
 */
export function buildSmsUri(phone: string, text: string, isIos?: boolean): string {
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const encodedBody = encodeURIComponent(text);
  const ios = isIos !== undefined ? isIos : isIosDevice();
  const separator = ios ? '&' : '?';
  return `sms:${cleanPhone}${separator}body=${encodedBody}`;
}

