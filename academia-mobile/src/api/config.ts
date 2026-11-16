import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_API_PORT = 8000;

/**
 * In Expo Go / a dev client, Metro tells the app which host it is being served
 * from (e.g. 192.168.1.20:8081). The Django dev server normally runs on the
 * same machine, so deriving the API host from Metro makes a physical phone work
 * without hardcoding a LAN IP that changes between networks.
 */
function stripHost(uri: string | null | undefined): string | null {
  if (!uri) return null;
  let value = uri.trim();
  if (!value) return null;
  value = value.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
  value = value.split('/')[0];
  if (value.startsWith('[')) {
    const end = value.indexOf(']');
    return end > 0 ? value.slice(1, end) : null;
  }
  return value.split(':')[0] || null;
}

function expoDevHost(): string | null {
  const legacy = Constants as unknown as {
    manifest?: { debuggerHost?: string };
    manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } };
  };

  return (
    stripHost(Constants.expoConfig?.hostUri) ??
    stripHost(legacy.manifest2?.extra?.expoGo?.debuggerHost) ??
    stripHost(legacy.manifest?.debuggerHost) ??
    null
  );
}

function browserHost(): string | null {
  if (Platform.OS !== 'web') return null;
  const location = (globalThis as { location?: { hostname?: string } }).location;
  return location?.hostname ?? null;
}

function isLoopback(host: string | null): boolean {
  return !host || host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

const explicitUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const devHost = expoDevHost() ?? browserHost();
const derivedUrl = devHost
  ? `http://${devHost}:${DEFAULT_API_PORT}/api/v1`
  : null;

function platformFallback(): string {
  if (derivedUrl && !isLoopback(devHost)) return derivedUrl;
  // Android emulators reach the host machine through 10.0.2.2.
  if (Platform.OS === 'android') return `http://10.0.2.2:${DEFAULT_API_PORT}/api/v1`;
  return `http://localhost:${DEFAULT_API_PORT}/api/v1`;
}

const fallbackUrl = platformFallback();

/**
 * API base URL, in priority order:
 *   1. EXPO_PUBLIC_API_URL (required for production builds and tunnels).
 *   2. The Expo dev-server host on port 8000 (Expo Go on the same Wi-Fi).
 *   3. localhost on iOS/web, 10.0.2.2 on the Android emulator.
 */
export const API_BASE_URL = (explicitUrl || fallbackUrl).replace(/\/+$/, '');

export const API_BASE_SOURCE: 'env' | 'dev-server' | 'platform' = explicitUrl
  ? 'env'
  : derivedUrl && !isLoopback(devHost)
    ? 'dev-server'
    : 'platform';

if (__DEV__) {
  console.log(`[A-Atlas] API base: ${API_BASE_URL} (${API_BASE_SOURCE})`);
}

if (__DEV__ && /(exp\.direct|ngrok|trycloudflare)/i.test(devHost ?? '')) {
  // Tunnel mode does not forward port 8000; set EXPO_PUBLIC_API_URL instead.
  console.warn(
    `A-Atlas: API host "${devHost}" looks like a tunnel. Set EXPO_PUBLIC_API_URL to the backend URL.`,
  );
}
