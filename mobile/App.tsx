import React from 'react';
import { ActivityIndicator, StyleSheet, useColorScheme, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold, useFonts } from '@expo-google-fonts/plus-jakarta-sans';
import { FontAwesome6 } from '@expo/vector-icons';

import { AuthProvider, useAuth } from './src/auth/AuthProvider';
import { UnreadProvider } from './src/auth/UnreadProvider';
import { BrandMark } from './src/components/BrandMark';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { Text } from './src/components/Text';
import { BRAND } from './src/config/brand';
import { AuthGateProvider } from './src/features/auth/AuthGateProvider';
import { NetworkProvider } from './src/features/network/NetworkProvider';
import { StaffWebProvider } from './src/features/staff/StaffWebProvider';
import { DrawerProvider } from './src/navigation/DrawerProvider';
import { RootNavigator } from './src/navigation/RootNavigator';
import { palettes, ThemeProvider, useTheme } from './src/theme';

export default function App() {
  const scheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    ...FontAwesome6.font,
  });

  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: (scheme === 'dark' ? palettes.dark : palettes.light).bg }} />;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <NetworkProvider>
            <AuthProvider>
              <AuthGateProvider>
                <UnreadProvider>
                  <StaffWebProvider>
                    <AppShell />
                  </StaffWebProvider>
                </UnreadProvider>
              </AuthGateProvider>
            </AuthProvider>
          </NetworkProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function AppShell() {
  const { status } = useAuth();
  const { mode } = useTheme();

  if (status === 'loading') return <BootSplash />;

  return (
    <>
      <DrawerProvider>
        <RootNavigator />
      </DrawerProvider>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

function BootSplash() {
  const { colors } = useTheme();
  return (
    <View style={[styles.splash, { backgroundColor: colors.bg }]}>
      <BrandMark width={110} />
      <Text variant="h1" style={{ marginTop: 16 }}>
        {BRAND.name}
      </Text>
      <Text size={13} color={colors.muted} center style={{ marginTop: 6 }}>
        {BRAND.tagline}
      </Text>
      <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
});