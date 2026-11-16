import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { ApiError, isAbortError, RefreshResult, setAccessToken, setRefreshHandler, setUnauthorizedHandler } from '../api/client';
import { api } from '../api/endpoints';
import type { AuthSession, User } from '../api/types';
import { STORAGE_KEYS, storage } from '../lib/storage';

export type AuthStatus = 'loading' | 'guest' | 'authenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  isAuthenticated: boolean;
  welcomeSeen: boolean;
  sessionExpiredAt: number;
  signInWithGoogleToken: (googleAccessToken: string) => Promise<User>;
  signInWithAccessToken: (access: string, refresh?: string) => Promise<User>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  updateProfile: (fullName: string) => Promise<User>;
  markWelcomeSeen: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const WELCOME_KEY = 'academia.welcome_seen';

function parseUser(raw: string | null): User | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as User;
    return parsed?.id ? parsed : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [welcomeSeen, setWelcomeSeen] = useState(true);
  const [sessionExpiredAt, setSessionExpiredAt] = useState(0);
  const hadSession = useRef(false);

  const clearSession = useCallback(async () => {
    hadSession.current = false;
    setAccessToken(null);
    setUser(null);
    setStatus('guest');
    await Promise.all([storage.remove(STORAGE_KEYS.accessToken), storage.remove(STORAGE_KEYS.refreshToken), storage.remove(STORAGE_KEYS.cachedUser)]);
  }, []);

  const persistSession = useCallback(async (access: string, refresh: string | null, nextUser: User) => {
    hadSession.current = true;
    setAccessToken(access);
    await Promise.all([
      storage.set(STORAGE_KEYS.accessToken, access),
      refresh ? storage.set(STORAGE_KEYS.refreshToken, refresh) : storage.remove(STORAGE_KEYS.refreshToken),
      storage.set(STORAGE_KEYS.cachedUser, JSON.stringify(nextUser)),
    ]);
    setUser(nextUser);
    setStatus('authenticated');
  }, []);

  const refreshSession = useCallback(async (): Promise<RefreshResult> => {
    const storedRefresh = await storage.get(STORAGE_KEYS.refreshToken);
    if (!storedRefresh) return { status: 'invalid' };

    try {
      // Refresh rotates the pair. Persist both before any retry can run.
      const tokens = await api.auth.refresh(storedRefresh);
      setAccessToken(tokens.access);
      await Promise.all([storage.set(STORAGE_KEYS.accessToken, tokens.access), storage.set(STORAGE_KEYS.refreshToken, tokens.refresh)]);
      return { status: 'ok', access: tokens.access };
    } catch (error) {
      if (error instanceof ApiError && (error.status === 400 || error.status === 401)) return { status: 'invalid' };
      // Network, timeout, 429 and 5xx must never end a valid session.
      return { status: 'transient' };
    }
  }, []);

  useEffect(() => {
    setRefreshHandler(refreshSession);
    setUnauthorizedHandler(() => {
      // Only a session that existed can expire, a guest never sees the expired sheet.
      if (hadSession.current) setSessionExpiredAt(Date.now());
      void clearSession();
    });
    return () => {
      setRefreshHandler(null);
      setUnauthorizedHandler(null);
    };
  }, [refreshSession, clearSession]);

  useEffect(() => {
    let alive = true;

    (async () => {
      const [storedAccess, storedRefresh, cachedRaw, storedWelcome] = await Promise.all([
        storage.get(STORAGE_KEYS.accessToken),
        storage.get(STORAGE_KEYS.refreshToken),
        storage.get(STORAGE_KEYS.cachedUser),
        storage.get(WELCOME_KEY),
      ]);

      if (!alive) return;
      setWelcomeSeen(storedWelcome === '1');

      const cached = parseUser(cachedRaw);
      if (cached) setUser(cached);

      // Seeded dev tokens exist in development builds only.
      const devAccess = __DEV__ ? process.env.EXPO_PUBLIC_DEV_ACCESS_TOKEN?.trim() : undefined;
      const devRefresh = __DEV__ ? process.env.EXPO_PUBLIC_DEV_REFRESH_TOKEN?.trim() : undefined;
      const access = storedAccess || devAccess || null;
      const refresh = storedRefresh || devRefresh || null;

      if (!access) {
        setStatus('guest');
        return;
      }

      hadSession.current = true;
      setAccessToken(access);
      if (refresh) await storage.set(STORAGE_KEYS.refreshToken, refresh);

      try {
        const me = await api.me.get();
        if (!alive) return;
        setUser(me);
        setStatus('authenticated');
        await storage.set(STORAGE_KEYS.cachedUser, JSON.stringify(me));
        if (storedWelcome !== '1') {
          setWelcomeSeen(true);
          await storage.set(WELCOME_KEY, '1');
        }
      } catch (error) {
        if (!alive || isAbortError(error)) return;
        if (error instanceof ApiError && error.status === 401 && !error.isNetwork) {
          await clearSession();
          return;
        }
        // Network, timeout, 429 and 5xx never end a valid session: start from the cached user.
        setStatus(cached ? 'authenticated' : 'guest');
      }
    })();

    return () => {
      alive = false;
    };
  }, [clearSession]);

  const markWelcomeSeen = useCallback(async () => {
    setWelcomeSeen(true);
    await storage.set(WELCOME_KEY, '1');
  }, []);

  const signInWithGoogleToken = useCallback(
    async (googleAccessToken: string) => {
      const session: AuthSession = await api.auth.google(googleAccessToken);
      await persistSession(session.access, session.refresh, session.user);
      await markWelcomeSeen();
      return session.user;
    },
    [persistSession, markWelcomeSeen],
  );

  const signInWithAccessToken = useCallback(
    async (access: string, refresh?: string) => {
      // Do not let a stale refresh token answer a failed developer token.
      await storage.remove(STORAGE_KEYS.refreshToken);
      setAccessToken(access);
      try {
        const me = await api.me.get();
        await persistSession(access, refresh?.trim() || null, me);
        await markWelcomeSeen();
        return me;
      } catch (error) {
        setAccessToken(null);
        throw error;
      }
    },
    [persistSession, markWelcomeSeen],
  );

  const signOut = useCallback(async () => {
    const refresh = await storage.get(STORAGE_KEYS.refreshToken);
    if (refresh) {
      try {
        await api.auth.logout(refresh);
      } catch {
        // Best effort. The local session is cleared either way.
      }
    }
    await clearSession();
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    try {
      const me = await api.me.get();
      setUser(me);
      if (status !== 'authenticated') setStatus('authenticated');
      await storage.set(STORAGE_KEYS.cachedUser, JSON.stringify(me));
      return me;
    } catch {
      return null;
    }
  }, [status]);

  const updateProfile = useCallback(async (fullName: string) => {
    const updated = await api.me.update({ full_name: fullName });
    setUser(updated);
    await storage.set(STORAGE_KEYS.cachedUser, JSON.stringify(updated));
    return updated;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, isAuthenticated: status === 'authenticated' && user !== null, welcomeSeen, sessionExpiredAt, signInWithGoogleToken, signInWithAccessToken, signOut, refreshUser, updateProfile, markWelcomeSeen }),
    [status, user, welcomeSeen, sessionExpiredAt, signInWithGoogleToken, signInWithAccessToken, signOut, refreshUser, updateProfile, markWelcomeSeen],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}