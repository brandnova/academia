import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import { ResponseType } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { errorMessage } from '../api/client';
import { Icon } from '../components/Icon';
import { Text } from '../components/Text';
import { fonts, radii, useTheme } from '../theme';

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? '';
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || CLIENT_ID;
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() ?? '';

export const googleConfigured = Boolean(WEB_CLIENT_ID);

type NativeGoogle = typeof import('@react-native-google-signin/google-signin');
let native: NativeGoogle | null = null;
if (Platform.OS !== 'web') {
  try {
    native = require('@react-native-google-signin/google-signin') as NativeGoogle;
  } catch {
    native = null; // Expo Go has no native Google module
  }
}

let nativeConfigured = false;
function configureNative() {
  if (!native || nativeConfigured) return;
  native.GoogleSignin.configure({ webClientId: WEB_CLIENT_ID || undefined, iosClientId: IOS_CLIENT_ID || undefined, scopes: ['email', 'profile'] });
  nativeConfigured = true;
}

interface Props {
  onToken: (googleAccessToken: string) => Promise<void>;
  disabled?: boolean;
  onError?: (error: unknown) => void;
}

/**
 * Obtains a Google access token and hands it to the backend, which verifies it against Google's userinfo
 * endpoint (no client secret anywhere). Android and iOS use the native Google account picker (Play services),
 * which needs no browser or redirect. Web uses the browser token flow with the web client id.
 */
export function GoogleSignInButton(props: Props) {
  if (!googleConfigured) return <UnavailableButton disabled={props.disabled} reason="config" />;
  if (Platform.OS === 'web') return <WebGoogleButton {...props} />;
  return native ? <NativeGoogleButton {...props} /> : <UnavailableButton disabled={props.disabled} reason="expo-go" />;
}

function ButtonView({ busy, disabled, onPress, error }: { busy?: boolean; disabled?: boolean; onPress: () => void; error?: string | null }) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Continue with Google"
        disabled={disabled || busy}
        onPress={onPress}
        style={({ pressed }) => [styles.button, { backgroundColor: colors.accentSolid, borderColor: colors.accentSolid, opacity: disabled ? 0.6 : pressed ? 0.9 : 1 }]}
      >
        {busy ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Icon name="google" family="brand" size={17} color="#FFFFFF" />
            <Text size={15} weight="semibold" color="#FFFFFF">
              Continue with Google
            </Text>
          </>
        )}
      </Pressable>
      {error ? (
        <Text accessibilityRole="alert" size={12} color={colors.danger} center style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function NativeGoogleButton({ onToken, disabled, onError }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fail = (err: unknown, fallback: string) => (onError ? onError(err) : setError(errorMessage(err, fallback)));

  const press = async () => {
    if (!native || busy) return;
    setBusy(true);
    setError(null);
    try {
      configureNative();
      await native.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      try {
        await native.GoogleSignin.signOut(); // always show the account chooser
      } catch {
        // Nothing to sign out of.
      }
      const result = (await native.GoogleSignin.signIn()) as { type?: string };
      if (result?.type === 'cancelled') return;
      const { accessToken } = await native.GoogleSignin.getTokens();
      if (!accessToken) throw new Error('Google did not return an access token. Please try again.');
      await onToken(accessToken);
    } catch (err) {
      const code = String((err as { code?: string })?.code ?? '');
      const codes = native.statusCodes;
      if (code === String(codes.SIGN_IN_CANCELLED) || code === String(codes.IN_PROGRESS)) return;
      if (code === String(codes.PLAY_SERVICES_NOT_AVAILABLE)) fail(new Error('Google Play services are missing or out of date on this phone.'), 'Google sign-in failed.');
      else if (code === '10' || /developer_error/i.test(`${code} ${(err as Error)?.message ?? ''}`)) fail(new Error('Google sign-in is not set up for this build. Check the Android client package name and SHA-1.'), 'Google sign-in failed.');
      else fail(err, 'Google sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  return <ButtonView busy={busy} disabled={disabled} onPress={press} error={error} />;
}

function WebGoogleButton({ onToken, disabled, onError }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const [request, response, promptAsync] = Google.useAuthRequest({ clientId: WEB_CLIENT_ID, webClientId: WEB_CLIENT_ID, scopes: ['openid', 'email', 'profile'], responseType: ResponseType.Token, usePKCE: false });

  const fail = (err: unknown, fallback: string) => (onErrorRef.current ? onErrorRef.current(err) : setError(errorMessage(err, fallback)));

  useEffect(() => {
    if (!response) return;
    if (response.type === 'success') {
      const token = response.authentication?.accessToken ?? response.params?.access_token;
      if (!token) return fail(new Error('Google did not return an access token. Please try again.'), 'Google sign-in failed.');
      setBusy(true);
      setError(null);
      onTokenRef
        .current(token)
        .catch((err: unknown) => fail(err, 'Could not sign you in.'))
        .finally(() => setBusy(false));
    } else if (response.type === 'error') {
      fail(new Error(response.error?.message || 'Google sign-in was cancelled or failed.'), 'Google sign-in failed.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  const press = async () => {
    setError(null);
    try {
      await promptAsync();
    } catch (err) {
      fail(err, 'Could not open Google sign-in.');
    }
  };

  return <ButtonView busy={busy} disabled={disabled || !request} onPress={press} error={error} />;
}

function UnavailableButton({ disabled, reason }: { disabled?: boolean; reason: 'config' | 'expo-go' }) {
  const press = () =>
    Alert.alert(
      reason === 'expo-go' ? 'Google sign-in needs the installed app' : 'Google sign-in is not configured',
      reason === 'expo-go' ? 'Expo Go cannot use the native Google sign-in. Use the installed preview or production build, or Developer access in development. You can still browse as a guest.' : 'Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in your .env file (and in eas.json for builds), then restart. You can still browse as a guest.',
    );
  return <ButtonView disabled={disabled} onPress={press} />;
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderRadius: radii.lg, minHeight: 50, paddingHorizontal: 16 },
  error: { marginTop: 10, fontFamily: fonts.regular },
});