import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, TextStyle, useColorScheme, View } from 'react-native';

import { storage } from '../lib/storage';

export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

export type ThemeMode = 'light' | 'dark';
export type ThemePreference = 'system' | 'light' | 'dark';

export interface Palette {
  isDark: boolean;
  bg: string;
  surface: string;
  subtle: string;
  line: string;
  strong: string;
  ink: string;
  muted: string;
  accent: string;
  accentSolid: string;
  accentSoft: string;
  onAccent: string;
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  warningBg: string;
  warningInk: string;
  overlay: string;
  skeleton: string;
}

const light: Palette = {
  isDark: false,
  bg: '#FBFAF8',
  surface: '#FFFFFF',
  subtle: 'rgba(22, 20, 15, 0.05)',
  line: '#E5E3DF',
  strong: '#CFCBC2',
  ink: '#16140F',
  muted: '#67645C',
  accent: '#3454D1',
  accentSolid: '#3454D1',
  accentSoft: 'rgba(52, 84, 209, 0.10)',
  onAccent: '#FFFFFF',
  success: '#1D8A6C',
  successSoft: 'rgba(29, 138, 108, 0.10)',
  danger: '#CE4747',
  dangerSoft: 'rgba(206, 71, 71, 0.08)',
  warningBg: '#FFFBEB',
  warningInk: '#B45309',
  overlay: 'rgba(0, 0, 0, 0.40)',
  skeleton: '#E5E3DF',
};

const dark: Palette = {
  isDark: true,
  bg: '#16171C',
  surface: '#1E2939',
  subtle: 'rgba(255, 255, 255, 0.08)',
  line: '#2C2D34',
  strong: '#3A3B44',
  ink: '#F5F3EE',
  muted: '#9EA1AB',
  accent: '#3454D1',
  accentSolid: '#3454D1',
  accentSoft: 'rgba(52, 84, 209, 0.16)',
  onAccent: '#FFFFFF',
  success: '#3FBF97',
  successSoft: 'rgba(63, 191, 151, 0.12)',
  danger: '#CE4747',
  dangerSoft: 'rgba(206, 71, 71, 0.16)',
  warningBg: 'rgba(120, 53, 15, 0.20)',
  warningInk: '#FCD34D',
  overlay: 'rgba(0, 0, 0, 0.55)',
  skeleton: '#2C2D34',
};

export const palettes = { light, dark } as const;

/** Browser focus rings around react-native-web inputs look wrong inside pills. */
export const webInputReset: TextStyle | undefined = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : undefined;

export const radii = { sm: 8, md: 8, lg: 12, xl: 16, pill: 999 } as const;

export const touchTarget = 44;

/** Only the raised ask button and sheets carry elevation. */
export const fabShadow = { shadowColor: '#3454D1', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 10, elevation: 8 } as const;

export const sheetShadow = { shadowColor: '#000000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.18, shadowRadius: 18, elevation: 24 } as const;

interface ThemeValue {
  mode: ThemeMode;
  preference: ThemePreference;
  colors: Palette;
  setPreference: (preference: ThemePreference) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);
const THEME_KEY = 'academia.theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    storage
      .get(THEME_KEY)
      .then((stored) => {
        if (alive && (stored === 'light' || stored === 'dark' || stored === 'system')) setPreferenceState(stored);
      })
      .catch(() => {})
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    storage.set(THEME_KEY, next).catch(() => {});
  }, []);

  const setMode = useCallback((next: ThemeMode) => setPreference(next), [setPreference]);
  const mode: ThemeMode = preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;
  const toggleMode = useCallback(() => setPreference(mode === 'dark' ? 'light' : 'dark'), [mode, setPreference]);

  const value = useMemo<ThemeValue>(() => ({ mode, preference, colors: mode === 'dark' ? dark : light, setPreference, setMode, toggleMode }), [mode, preference, setPreference, setMode, toggleMode]);

  // Hold the first paint until the stored choice is known, so a manual theme never flashes the other one.
  if (!ready) return <View style={{ flex: 1, backgroundColor: (systemScheme === 'dark' ? dark : light).bg }} />;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}