/**
 * Cart Store (Phase 9 Task 2 & Addendum A3)
 *
 * Rules:
 * - localStorage key: 'cart:v1'
 * - Expires 30 days after the last change.
 * - Same optionId merges into one line.
 * - Max 30 distinct lines in cart.
 * - Quantity: 1 to 50 per line.
 * - Cross-tab sync via window 'storage' event.
 * - In-memory fallback with Persian warning when localStorage is unavailable.
 * - Implemented with useSyncExternalStore (React 19 standard; zero heavy libraries).
 * - Pure functions exported for testability.
 */

import { useSyncExternalStore } from 'react';
import { parseLocalizedNumber } from './domain-utils';

export const CART_STORAGE_KEY = 'cart:v1';
export const CUSTOMER_STORAGE_KEY = 'cart-customer:v1';
export const CART_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const MAX_CART_LINES = 30;
export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 50;

export interface CartLine {
  optionId: string;
  productId: string;
  qty: number;
}

export interface StoredCartData {
  lines: CartLine[];
  updatedAt: number;
}

export interface SavedCustomerData {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  mobile: string;
  province?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  notes?: string;
  preferredContactMethod?: string;
}

// ----------------------------------------------------------------------
// Pure Utility Functions (100% Deterministic & Unit-Testable)
// ----------------------------------------------------------------------

export function clampQuantity(qty: number | unknown): number {
  const parsed = typeof qty === 'number' ? qty : parseLocalizedNumber(qty);
  if (isNaN(parsed) || parsed < MIN_QUANTITY) return MIN_QUANTITY;
  if (parsed > MAX_QUANTITY) return MAX_QUANTITY;
  return Math.floor(parsed);
}

export function isCartExpired(updatedAt: number, now: number = Date.now()): boolean {
  if (!updatedAt || typeof updatedAt !== 'number') return true;
  return now - updatedAt > CART_EXPIRY_MS;
}

export function getCartTotalQuantity(lines: CartLine[]): number {
  return lines.reduce((sum, item) => sum + item.qty, 0);
}

export function mergeCartLine(
  lines: CartLine[],
  newLine: CartLine,
  maxLines: number = MAX_CART_LINES
): { lines: CartLine[]; error?: string } {
  const clampedQty = clampQuantity(newLine.qty);
  const existingIndex = lines.findIndex((l) => l.optionId === newLine.optionId);

  if (existingIndex >= 0) {
    const nextLines = [...lines];
    const current = nextLines[existingIndex];
    const combinedQty = clampQuantity(current.qty + clampedQty);
    nextLines[existingIndex] = {
      ...current,
      qty: combinedQty,
    };
    return { lines: nextLines };
  }

  if (lines.length >= maxLines) {
    return {
      lines,
      error: `حداکثر ظرفیت سبد خرید (${maxLines} قلم کالا) تکمیل شده است.`,
    };
  }

  return {
    lines: [...lines, { ...newLine, qty: clampedQty }],
  };
}

export function updateLineQuantity(
  lines: CartLine[],
  optionId: string,
  qty: number
): CartLine[] {
  const targetIndex = lines.findIndex((l) => l.optionId === optionId);
  if (targetIndex < 0) return lines;

  const nextLines = [...lines];
  nextLines[targetIndex] = {
    ...nextLines[targetIndex],
    qty: clampQuantity(qty),
  };
  return nextLines;
}

export function removeCartLine(lines: CartLine[], optionId: string): CartLine[] {
  return lines.filter((l) => l.optionId !== optionId);
}

// ----------------------------------------------------------------------
// Storage Engine & In-Memory Fallback
// ----------------------------------------------------------------------

let memoryCart: StoredCartData = { lines: [], updatedAt: Date.now() };
let isStorageAvailable = true;
let isStorageChecked = false;

function checkStorageAvailability(): boolean {
  if (typeof window === 'undefined') return false;
  if (isStorageChecked) return isStorageAvailable;

  try {
    const testKey = '__cart_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    isStorageAvailable = true;
  } catch {
    isStorageAvailable = false;
  }
  isStorageChecked = true;
  return isStorageAvailable;
}

export function getStorageWarning(): string | null {
  if (typeof window === 'undefined') return null;
  checkStorageAvailability();
  if (!isStorageAvailable) {
    return 'به دلیل محدودیت مرورگر در حالت ناشناس (Private/Incognito)، اطلاعات سبد خرید تنها تا زمان باز بودن این برگه نگهداری می‌شود.';
  }
  return null;
}

function readStoredCart(): StoredCartData {
  if (typeof window === 'undefined') {
    return { lines: [], updatedAt: 0 };
  }

  if (!checkStorageAvailability()) {
    if (isCartExpired(memoryCart.updatedAt)) {
      memoryCart = { lines: [], updatedAt: Date.now() };
    }
    return memoryCart;
  }

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) {
      return { lines: [], updatedAt: 0 };
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.lines) || typeof parsed.updatedAt !== 'number') {
      window.localStorage.removeItem(CART_STORAGE_KEY);
      return { lines: [], updatedAt: 0 };
    }

    if (isCartExpired(parsed.updatedAt)) {
      window.localStorage.removeItem(CART_STORAGE_KEY);
      return { lines: [], updatedAt: 0 };
    }

    return {
      lines: parsed.lines,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return { lines: [], updatedAt: 0 };
  }
}

function writeStoredCart(data: StoredCartData): void {
  const updatedData: StoredCartData = {
    lines: data.lines,
    updatedAt: Date.now(),
  };

  if (!checkStorageAvailability()) {
    memoryCart = updatedData;
    notifyListeners();
    return;
  }

  try {
    if (updatedData.lines.length === 0) {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    } else {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedData));
    }
  } catch (err) {
    // QuotaExceeded or restricted
    memoryCart = updatedData;
    isStorageAvailable = false;
  }

  notifyListeners();
}

// ----------------------------------------------------------------------
// External Store Listeners
// ----------------------------------------------------------------------

type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === CART_STORAGE_KEY) {
      notifyListeners();
    }
  });
}

function subscribe(callback: Listener): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

// Cached snapshot to avoid infinite render loops in useSyncExternalStore
let cachedSnapshot: StoredCartData = { lines: [], updatedAt: 0 };
let cachedRawJson = '';

function getSnapshot(): StoredCartData {
  const current = readStoredCart();
  const raw = JSON.stringify(current);
  if (raw !== cachedRawJson) {
    cachedRawJson = raw;
    cachedSnapshot = current;
  }
  return cachedSnapshot;
}

const SERVER_SNAPSHOT: StoredCartData = { lines: [], updatedAt: 0 };
function getServerSnapshot(): StoredCartData {
  return SERVER_SNAPSHOT;
}

// ----------------------------------------------------------------------
// Cart Actions API
// ----------------------------------------------------------------------

export const cartActions = {
  addItem(item: { productId: string; optionId: string; qty: number }): { success: boolean; error?: string } {
    const current = readStoredCart();
    const result = mergeCartLine(current.lines, item);
    if (result.error) {
      return { success: false, error: result.error };
    }
    writeStoredCart({ lines: result.lines, updatedAt: Date.now() });
    return { success: true };
  },

  updateQuantity(optionId: string, qty: number): void {
    const current = readStoredCart();
    const updated = updateLineQuantity(current.lines, optionId, qty);
    writeStoredCart({ lines: updated, updatedAt: Date.now() });
  },

  removeItem(optionId: string): void {
    const current = readStoredCart();
    const updated = removeCartLine(current.lines, optionId);
    writeStoredCart({ lines: updated, updatedAt: Date.now() });
  },

  switchOption(oldOptionId: string, newOptionId: string): void {
    const current = readStoredCart();
    const existingOld = current.lines.find((l) => l.optionId === oldOptionId);
    if (!existingOld) return;

    const existingNewIndex = current.lines.findIndex((l) => l.optionId === newOptionId);
    let nextLines: CartLine[];

    if (existingNewIndex >= 0) {
      nextLines = current.lines
        .filter((l) => l.optionId !== oldOptionId)
        .map((l) =>
          l.optionId === newOptionId
            ? { ...l, qty: clampQuantity(l.qty + existingOld.qty) }
            : l
        );
    } else {
      nextLines = current.lines.map((l) =>
        l.optionId === oldOptionId ? { ...l, optionId: newOptionId } : l
      );
    }

    writeStoredCart({ lines: nextLines, updatedAt: Date.now() });
  },

  clearCart(): void {
    writeStoredCart({ lines: [], updatedAt: Date.now() });
  },
};

/**
 * React hook subscribing to client-side cart store.
 */
export function useCartStore(): {
  lines: CartLine[];
  updatedAt: number;
  totalQuantity: number;
  warning: string | null;
  actions: typeof cartActions;
} {
  const cart = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const totalQuantity = getCartTotalQuantity(cart.lines);
  const warning = getStorageWarning();

  return {
    lines: cart.lines,
    updatedAt: cart.updatedAt,
    totalQuantity,
    warning,
    actions: cartActions,
  };
}

// ----------------------------------------------------------------------
// Customer "Remember Me" Storage Helpers (cart-customer:v1)
// ----------------------------------------------------------------------

export function getSavedCustomer(): SavedCustomerData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CUSTOMER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveCustomerLocally(data: SavedCustomerData): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export function clearSavedCustomer(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(CUSTOMER_STORAGE_KEY);
  } catch {}
}
