'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { getNewOrdersCountAction } from '@/server/actions/order-actions';
import { getAdminFeedbacksAction } from '@/server/actions/feedback-actions';

export const ADMIN_ORDERS_CHANGED_EVENT = 'admin:orders-changed';
export const ADMIN_FEEDBACKS_CHANGED_EVENT = 'admin:feedbacks-changed';

export function dispatchOrdersChanged(count?: number) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(ADMIN_ORDERS_CHANGED_EVENT, {
        detail: count !== undefined ? { count } : undefined,
      })
    );
  }
}

export function dispatchFeedbacksChanged(count?: number) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(ADMIN_FEEDBACKS_CHANGED_EVENT, {
        detail: count !== undefined ? { count } : undefined,
      })
    );
  }
}

interface AdminBadgeContextValue {
  newOrdersCount: number;
  unreadFeedbacksCount: number;
  setNewOrdersCount: React.Dispatch<React.SetStateAction<number>>;
  setUnreadFeedbacksCount: React.Dispatch<React.SetStateAction<number>>;
  refreshOrdersCount: () => Promise<void>;
  refreshFeedbacksCount: () => Promise<void>;
  refreshAllCounts: () => Promise<void>;
}

const AdminBadgeContext = createContext<AdminBadgeContextValue | null>(null);

export function AdminBadgeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [newOrdersCount, setNewOrdersCount] = useState<number>(0);
  const [unreadFeedbacksCount, setUnreadFeedbacksCount] = useState<number>(0);

  const refreshOrdersCount = useCallback(async () => {
    try {
      const res = await getNewOrdersCountAction();
      if (res && res.success && typeof res.count === 'number') {
        setNewOrdersCount(res.count);
      }
    } catch {}
  }, []);

  const refreshFeedbacksCount = useCallback(async () => {
    try {
      const res = await getAdminFeedbacksAction({ status: 'NEW' });
      if (res && res.success && typeof res.unreadCount === 'number') {
        setUnreadFeedbacksCount(res.unreadCount);
      }
    } catch {}
  }, []);

  const refreshAllCounts = useCallback(async () => {
    await Promise.allSettled([refreshOrdersCount(), refreshFeedbacksCount()]);
  }, [refreshOrdersCount, refreshFeedbacksCount]);

  // Refresh whenever pathname changes
  useEffect(() => {
    refreshAllCounts();
  }, [pathname, refreshAllCounts]);

  // Silent polling every 15 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      refreshAllCounts();
    }, 15000);

    return () => clearInterval(timer);
  }, [refreshAllCounts]);

  // Listen to custom dispatch events for real-time immediate updates
  useEffect(() => {
    const handleOrdersEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ count?: number }>;
      if (customEvent.detail && typeof customEvent.detail.count === 'number') {
        setNewOrdersCount(customEvent.detail.count);
      } else {
        refreshOrdersCount();
      }
    };

    const handleFeedbacksEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ count?: number }>;
      if (customEvent.detail && typeof customEvent.detail.count === 'number') {
        setUnreadFeedbacksCount(customEvent.detail.count);
      } else {
        refreshFeedbacksCount();
      }
    };

    window.addEventListener(ADMIN_ORDERS_CHANGED_EVENT, handleOrdersEvent);
    window.addEventListener(ADMIN_FEEDBACKS_CHANGED_EVENT, handleFeedbacksEvent);

    return () => {
      window.removeEventListener(ADMIN_ORDERS_CHANGED_EVENT, handleOrdersEvent);
      window.removeEventListener(ADMIN_FEEDBACKS_CHANGED_EVENT, handleFeedbacksEvent);
    };
  }, [refreshOrdersCount, refreshFeedbacksCount]);

  return (
    <AdminBadgeContext.Provider
      value={{
        newOrdersCount,
        unreadFeedbacksCount,
        setNewOrdersCount,
        setUnreadFeedbacksCount,
        refreshOrdersCount,
        refreshFeedbacksCount,
        refreshAllCounts,
      }}
    >
      {children}
    </AdminBadgeContext.Provider>
  );
}

const defaultContext: AdminBadgeContextValue = {
  newOrdersCount: 0,
  unreadFeedbacksCount: 0,
  setNewOrdersCount: () => {},
  setUnreadFeedbacksCount: () => {},
  refreshOrdersCount: async () => {},
  refreshFeedbacksCount: async () => {},
  refreshAllCounts: async () => {},
};

export function useAdminBadges(): AdminBadgeContextValue {
  const context = useContext(AdminBadgeContext);
  return context || defaultContext;
}

