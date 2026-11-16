import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Token-safe key/value storage.
 *
 * Native uses the iOS keychain / Android keystore via expo-secure-store. The
 * web build (used for previews and local design checks) falls back to
 * localStorage, which is the best available option in a browser.
 */
const isWeb = Platform.OS === 'web';

export const storage = {
  async get(key: string): Promise<string | null> {
    if (isWeb) {
      try {
        return globalThis.localStorage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },

  async set(key: string, value: string): Promise<void> {
    if (isWeb) {
      try {
        globalThis.localStorage?.setItem(key, value);
      } catch {
        // Storage full or blocked; tokens simply won't persist.
      }
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED,
      });
    } catch {
      // Ignore; the in-memory session still works for this run.
    }
  },

  async remove(key: string): Promise<void> {
    if (isWeb) {
      try {
        globalThis.localStorage?.removeItem(key);
      } catch {
        // no-op
      }
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // no-op
    }
  },
};

export const STORAGE_KEYS = {
  accessToken: 'academia.access_token',
  refreshToken: 'academia.refresh_token',
  cachedUser: 'academia.user',
} as const;
