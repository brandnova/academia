import { Platform } from 'react-native';

const explicitWeb = process.env.EXPO_PUBLIC_WEB_BASE_URL?.trim();

export const WEB_BASE_URL = (explicitWeb || 'https://academia-prvw.vercel.app').replace(/\/+$/, '');

export const SUPPORT_EMAIL = process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim() || 'brandnova.dev@gmail.com';

/** The developer token sheet exists in development builds only, never in preview or production builds. */
export const DEV_MODE = __DEV__ && process.env.EXPO_PUBLIC_DEV_MODE === '1';

export const PLATFORM_ACCOUNT_IDS = (process.env.EXPO_PUBLIC_PLATFORM_ACCOUNT_ID ?? '')
  .split(',')
  .map((value: string) => value.trim())
  .filter(Boolean);

export function isPlatformAccount(userId: string | null | undefined): boolean {
  return Boolean(userId && PLATFORM_ACCOUNT_IDS.includes(userId));
}

/** One place for every outbound link to the web app. */
export function webUrl(path: string): string {
  return `${WEB_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export const IS_WEB = Platform.OS === 'web';