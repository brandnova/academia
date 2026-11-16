import React, { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { errorMessage, fieldError } from '../../api/client';
import { useAuth } from '../../auth/AuthProvider';
import { Button } from '../../components/Button';
import { FormError } from '../../components/Form';
import { Sheet } from '../../components/Sheet';
import { Text } from '../../components/Text';
import { useTheme, webInputReset } from '../../theme';

/** Paste a token from print_test_tokens to sign in as a seeded test user. Development builds only. */
export function DevAccessSheet({ visible, onClose, onSuccess }: { visible: boolean; onClose: () => void; onSuccess?: () => void }) {
  const { colors } = useTheme();
  const { signInWithAccessToken } = useAuth();
  const [access, setAccess] = useState('');
  const [refresh, setRefresh] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!access.trim()) return setError('Paste an access token first.');
    setBusy(true);
    setError(null);
    try {
      await signInWithAccessToken(access.trim(), refresh.trim() || undefined);
      setAccess('');
      setRefresh('');
      onClose();
      onSuccess?.();
    } catch (err) {
      setError(fieldError(err, 'access_token') ?? errorMessage(err, 'That token could not be used.'));
    } finally {
      setBusy(false);
    }
  };

  const input = [styles.input, webInputReset, { color: colors.ink, borderColor: colors.strong, backgroundColor: colors.surface }];

  return (
    <Sheet visible={visible} onClose={onClose} title="Developer access" showClose>
      <Text size={12} color={colors.danger} style={{ marginBottom: 8 }}>
        Local only. This sheet does not exist in preview or production builds.
      </Text>
      <Text size={14} color={colors.muted} style={{ marginBottom: 14 }}>
        Paste both tokens from the backend command print_test_tokens (the refresh token keeps the session alive past the first hour).
      </Text>
      <FormError message={error} />
      <Text size={12} color={colors.muted} style={{ marginBottom: 4 }}>
        Access token
      </Text>
      <TextInput value={access} onChangeText={setAccess} placeholder="eyJ..." placeholderTextColor={colors.muted} autoCapitalize="none" autoCorrect={false} multiline accessibilityLabel="Access token" style={input} />
      <Text size={12} color={colors.muted} style={{ marginTop: 12, marginBottom: 4 }}>
        Refresh token (optional)
      </Text>
      <TextInput value={refresh} onChangeText={setRefresh} placeholder="eyJ..." placeholderTextColor={colors.muted} autoCapitalize="none" autoCorrect={false} multiline accessibilityLabel="Refresh token" style={input} />
      <Button title="Use token" onPress={submit} loading={busy} fullWidth style={{ marginTop: 16 }} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, minHeight: 72, fontSize: 12, textAlignVertical: 'top' },
});