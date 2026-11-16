import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { api } from '../api/endpoints';
import { useAuth } from './AuthProvider';

interface UnreadContextValue {
  unreadCount: number;
  refresh: () => Promise<void>;
  setUnreadCount: (count: number) => void;
}

const UnreadContext = createContext<UnreadContextValue | null>(null);

export function UnreadProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    try {
      const page = await api.notifications.list({ page_size: 1 });
      setUnreadCount(page.unread_count ?? 0);
    } catch {
      // A failed badge refresh must never interrupt navigation.
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh, user?.id]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  const value = useMemo<UnreadContextValue>(
    () => ({ unreadCount, refresh, setUnreadCount }),
    [unreadCount, refresh],
  );

  return <UnreadContext.Provider value={value}>{children}</UnreadContext.Provider>;
}

export function useUnread(): UnreadContextValue {
  const value = useContext(UnreadContext);
  if (!value) throw new Error('useUnread must be used inside UnreadProvider');
  return value;
}
