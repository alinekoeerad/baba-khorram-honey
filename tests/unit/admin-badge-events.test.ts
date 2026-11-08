import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ADMIN_ORDERS_CHANGED_EVENT,
  ADMIN_FEEDBACKS_CHANGED_EVENT,
  dispatchOrdersChanged,
  dispatchFeedbacksChanged,
} from '@/components/admin/admin-badge-context';

describe('Admin Badge Events and Notification System', () => {
  let originalWindow: any;
  let mockWindow: EventTarget;

  beforeEach(() => {
    originalWindow = (globalThis as any).window;
    mockWindow = new EventTarget();
    (globalThis as any).window = mockWindow;
  });

  afterEach(() => {
    (globalThis as any).window = originalWindow;
  });

  it('dispatches custom event on window when dispatchOrdersChanged is called with count', () => {
    const handler = vi.fn();
    mockWindow.addEventListener(ADMIN_ORDERS_CHANGED_EVENT, handler);

    dispatchOrdersChanged(5);

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent;
    expect(event.type).toBe(ADMIN_ORDERS_CHANGED_EVENT);
    expect(event.detail?.count).toBe(5);

    mockWindow.removeEventListener(ADMIN_ORDERS_CHANGED_EVENT, handler);
  });

  it('dispatches custom event when dispatchOrdersChanged is called with 0', () => {
    const handler = vi.fn();
    mockWindow.addEventListener(ADMIN_ORDERS_CHANGED_EVENT, handler);

    dispatchOrdersChanged(0);

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent;
    expect(event.detail?.count).toBe(0);

    mockWindow.removeEventListener(ADMIN_ORDERS_CHANGED_EVENT, handler);
  });

  it('dispatches custom event on window when dispatchFeedbacksChanged is called', () => {
    const handler = vi.fn();
    mockWindow.addEventListener(ADMIN_FEEDBACKS_CHANGED_EVENT, handler);

    dispatchFeedbacksChanged(3);

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent;
    expect(event.type).toBe(ADMIN_FEEDBACKS_CHANGED_EVENT);
    expect(event.detail?.count).toBe(3);

    mockWindow.removeEventListener(ADMIN_FEEDBACKS_CHANGED_EVENT, handler);
  });
});
