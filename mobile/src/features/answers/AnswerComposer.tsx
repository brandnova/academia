import React, { useState } from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { errorMessage } from '../../api/client';
import { api } from '../../api/endpoints';
import { useAuth } from '../../auth/AuthProvider';
import { Button } from '../../components/Button';
import { FormError } from '../../components/Form';
import { Icon } from '../../components/Icon';
import { MarkdownEditor } from '../../components/MarkdownEditor';
import { Text } from '../../components/Text';
import { useKeyboard } from '../../lib/useKeyboard';
import { useTheme } from '../../theme';
import { useAuthGate } from '../auth/AuthGateProvider';

/**
 * Sticky answer bar. Owns its own draft and post state. Locked questions show
 * the locked line, guests get the sign-in gate. Place it inside a KeyboardAvoid.
 */
export function AnswerComposer({ questionId, locked, onPosted }: { questionId: string; locked: boolean; onPosted: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { visible: keyboardVisible } = useKeyboard();
  const { isAuthenticated } = useAuth();
  const { requireAuth } = useAuthGate();

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const post = async () => {
    if (posting) return;
    if (!isAuthenticated) {
      requireAuth(undefined, 'Sign in to answer this question.');
      return;
    }
    const body = draft.trim();
    if (!body) {
      setError(new Error('Write an answer first.'));
      return;
    }
    setPosting(true);
    setError(null);
    try {
      await api.answers.create({ question_id: questionId, body });
      Keyboard.dismiss();
      setDraft('');
      setOpen(false);
      onPosted();
    } catch (err) {
      setError(err);
    } finally {
      setPosting(false);
    }
  };

  return (
    <View style={[styles.bar, { backgroundColor: colors.surface, borderTopColor: colors.line, paddingBottom: keyboardVisible ? 10 : Math.max(insets.bottom, 10) }]}>
      {locked ? (
        <View style={styles.lockedLine}>
          <Icon name="lock" size={13} color={colors.muted} />
          <Text size={14} color={colors.muted} style={{ flex: 1 }}>
            This question is locked and is no longer accepting new answers.
          </Text>
        </View>
      ) : !isAuthenticated ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Sign in to answer this question" onPress={() => requireAuth(undefined, 'Sign in to answer this question.')} style={styles.signInLine}>
          <Text size={14} color={colors.muted}>
            Sign in to answer this question
          </Text>
        </Pressable>
      ) : !open ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Write an answer"
          onPress={() => {
            setError(null);
            setOpen(true);
          }}
          style={styles.pillWrap}
        >
          <View style={[styles.pill, { backgroundColor: colors.subtle }]}>
            <Text size={14} color={colors.muted}>
              Write an answer...
            </Text>
          </View>
        </Pressable>
      ) : (
        <View style={{ paddingHorizontal: 12 }}>
          <View style={styles.header}>
            <Text size={12} weight="semibold" color={colors.muted}>
              Your answer
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Collapse answer editor"
              onPress={() => {
                Keyboard.dismiss();
                setOpen(false);
              }}
              hitSlop={8}
            >
              <Icon name="chevronDown" size={13} color={colors.muted} />
            </Pressable>
          </View>
          <MarkdownEditor value={draft} onChangeText={setDraft} placeholder="Write your answer..." minHeight={72} maxHeight={120} toolbar="bottom" autoFocus accessibilityLabel="Your answer" />
          <FormError message={error ? errorMessage(error) : null} />
          <Button title="Post answer" onPress={post} loading={posting} fullWidth style={{ marginTop: 8 }} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8 },
  lockedLine: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  signInLine: { paddingHorizontal: 16, paddingVertical: 12, minHeight: 48, justifyContent: 'center' },
  pillWrap: { paddingHorizontal: 12 },
  pill: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 12, minHeight: 44, justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, paddingHorizontal: 2, paddingTop: 4 },
});