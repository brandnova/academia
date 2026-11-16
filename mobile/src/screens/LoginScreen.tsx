import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import { ApiError, errorMessage } from '../api/client';
import { useAuth } from '../auth/AuthProvider';
import { GoogleSignInButton } from '../auth/GoogleSignInButton';
import { BrandMark } from '../components/BrandMark';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { DEV_MODE, SUPPORT_EMAIL } from '../config/app';
import { DevAccessSheet } from '../features/auth/DevAccessSheet';
import type { RootStackParamList } from '../navigation/types';
import { radii, useTheme } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Login'>;

interface LoginError {
  message: string;
  support: boolean;
}

export function LoginScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const { isAuthenticated, signInWithGoogleToken, markWelcomeSeen } = useAuth();
  const [error, setError] = useState<LoginError | null>(null);
  const [devOpen, setDevOpen] = useState(false);

  const enterApp = useCallback(async () => {
    await markWelcomeSeen();
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  }, [markWelcomeSeen, navigation]);

  useEffect(() => {
    if (isAuthenticated) navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  }, [isAuthenticated, navigation]);

  const onGoogleToken = useCallback(
    async (token: string) => {
      setError(null);
      try {
        await signInWithGoogleToken(token);
        await enterApp();
      } catch (err) {
        if (err instanceof ApiError && err.status === 403) return setError({ message: err.message, support: true });
        if (err instanceof ApiError && err.status === 401) return setError({ message: "We couldn't verify your Google account. Please try again.", support: false });
        setError({ message: errorMessage(err, 'Could not sign you in.'), support: false });
      }
    },
    [enterApp, signInWithGoogleToken],
  );

  return (
    <Screen edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <BrandMark width={120} />
          <Text variant="display" center style={{ marginBottom: 12 }}>
            Academic answers for your school
          </Text>
          <Text size={15} color={colors.muted} center>
            Ask once, answer well, and the next student finds it without asking again. Organized by school and department.
          </Text>

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}>
              <Text size={14} color={colors.danger}>
                {error.message}
              </Text>
              {error.support ? (
                <Text size={12} color={colors.muted} style={{ marginTop: 4 }}>
                  If you think this is a mistake, contact {SUPPORT_EMAIL}.
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={styles.actions}>
          <GoogleSignInButton onToken={onGoogleToken} onError={(err) => setError({ message: errorMessage(err, 'Google sign-in failed.'), support: false })} />

          <Pressable accessibilityRole="button" accessibilityLabel="Browse as a guest" onPress={enterApp} style={({ pressed }) => [styles.guest, { borderColor: colors.strong, opacity: pressed ? 0.7 : 1 }]}>
            <Text size={14} weight="semibold" center>
              Browse as a guest
            </Text>
          </Pressable>

          {DEV_MODE ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Developer access, local only" onPress={() => setDevOpen(true)} style={styles.devButton}>
              <Text size={11} color={colors.muted} center style={{ textDecorationLine: 'underline' }}>
                Developer access (local only)
              </Text>
            </Pressable>
          ) : null}

          <Text size={11} color={colors.muted} center style={{ marginTop: 16 }}>
            By continuing you agree to the{' '}
            <Text size={11} color={colors.muted} style={{ textDecorationLine: 'underline' }} onPress={() => navigation.navigate('Pages')} suppressHighlighting>
              Terms and Privacy Policy
            </Text>
            .
          </Text>
        </View>
      </ScrollView>

      {DEV_MODE ? <DevAccessSheet visible={devOpen} onClose={() => setDevOpen(false)} onSuccess={enterApp} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 },
  top: { flex: 1, alignItems: 'center' },
  brand: { alignSelf: 'center', marginBottom: 24 },
  errorBox: { borderWidth: 1, borderRadius: 8, padding: 12, marginTop: 20 },
  actions: { marginTop: 28 },
  guest: { borderWidth: 1, borderRadius: radii.lg, paddingVertical: 13, marginTop: 12, minHeight: 48, justifyContent: 'center' },
  devButton: { marginTop: 14, paddingVertical: 6 },
});