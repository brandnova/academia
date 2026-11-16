import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { ApiError, errorMessage } from '../../api/client';
import { useAuth } from '../../auth/AuthProvider';
import { GoogleSignInButton } from '../../auth/GoogleSignInButton';
import { Sheet } from '../../components/Sheet';
import { Text } from '../../components/Text';
import { DEV_MODE, SUPPORT_EMAIL } from '../../config/app';
import { useTheme } from '../../theme';
import { DevAccessSheet } from './DevAccessSheet';

interface AuthGateValue {
  requireAuth: (action?: () => void, message?: string) => boolean;
  promptSignIn: (message?: string) => void;
}

const AuthGateContext = createContext<AuthGateValue | null>(null);

const DEFAULT_MESSAGE = 'Browsing is open to everyone. Asking, answering, voting and following need an account.';

/**
 * One sign-in sheet used by every action in the app. It keeps the user on the screen they were on
 * and resumes the pending action after a successful login.
 */
export function AuthGateProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const { isAuthenticated, signInWithGoogleToken, sessionExpiredAt } = useAuth();
  const [visible, setVisible] = useState(false);
  const [devOpen, setDevOpen] = useState(false);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [signInError, setSignInError] = useState<{ message: string; support: boolean } | null>(null);
  const pending = useRef<(() => void) | null>(null);
  const lastExpiry = useRef(0);

  const promptSignIn = useCallback((nextMessage?: string) => {
    setMessage(nextMessage ?? DEFAULT_MESSAGE);
    setSignInError(null);
    setVisible(true);
  }, []);

  const requireAuth = useCallback(
    (action?: () => void, nextMessage?: string) => {
      if (isAuthenticated) {
        action?.();
        return true;
      }
      pending.current = action ?? null;
      promptSignIn(nextMessage);
      return false;
    },
    [isAuthenticated, promptSignIn],
  );

  useEffect(() => {
    if (!sessionExpiredAt || sessionExpiredAt === lastExpiry.current) return;
    lastExpiry.current = sessionExpiredAt;
    if (!isAuthenticated) {
      pending.current = null;
      promptSignIn('Your session expired. Sign in to pick up where you left off.');
    }
  }, [sessionExpiredAt, isAuthenticated, promptSignIn]);

  const resume = useCallback(() => {
    const action = pending.current;
    pending.current = null;
    if (action) setTimeout(action, 250);
  }, []);

  const onToken = useCallback(
    async (token: string) => {
      await signInWithGoogleToken(token);
      setSignInError(null);
      setVisible(false);
      resume();
    },
    [signInWithGoogleToken, resume],
  );

  return (
    <AuthGateContext.Provider value={{ requireAuth, promptSignIn }}>
      {children}
      <Sheet
        visible={visible}
        onClose={() => {
          pending.current = null;
          setVisible(false);
        }}
        title="Sign in to continue"
      >
        <Text size={14} color={colors.muted} style={{ marginBottom: 18 }}>
          {message}
        </Text>
        {signInError ? (
          <View style={{ marginBottom: 12 }}>
            <Text size={13} color={colors.danger}>
              {signInError.message}
            </Text>
            {signInError.support ? (
              <Text size={12} color={colors.muted} style={{ marginTop: 2 }}>
                If you think this is a mistake, contact {SUPPORT_EMAIL}.
              </Text>
            ) : null}
          </View>
        ) : null}
        <GoogleSignInButton onToken={onToken} onError={(error) => setSignInError({ message: errorMessage(error, 'Could not sign you in.'), support: error instanceof ApiError && error.status === 403 })} />
        {DEV_MODE ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Developer access, local only"
            onPress={() => {
              setVisible(false);
              setTimeout(() => setDevOpen(true), 200);
            }}
            style={{ paddingVertical: 12 }}
          >
            <Text size={11} color={colors.muted} center style={{ textDecorationLine: 'underline' }}>
              Developer access (local only)
            </Text>
          </Pressable>
        ) : null}
      </Sheet>
      {DEV_MODE ? <DevAccessSheet visible={devOpen} onClose={() => setDevOpen(false)} onSuccess={resume} /> : null}
    </AuthGateContext.Provider>
  );
}

export function useAuthGate(): AuthGateValue {
  const value = useContext(AuthGateContext);
  if (!value) throw new Error('useAuthGate must be used inside AuthGateProvider');
  return value;
}