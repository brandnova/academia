import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, IconName } from '../components/Icon';
import { Text } from '../components/Text';
import { useKeyboard } from '../lib/useKeyboard';
import { radii, sheetShadow, useTheme } from '../theme';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  label?: string;
  children: React.ReactNode;
  scroll?: boolean;
  footer?: React.ReactNode;
  showClose?: boolean;
  headerRight?: React.ReactNode;
}

/**
 * Native-feeling bottom sheet. Backdrop tap, Android back, and the close
 * affordance dismiss it. Content is capped at 82 percent of the screen and
 * scrolls when it grows.
 */
export function Sheet({ visible, onClose, title, label, children, scroll = true, footer, showClose = false, headerRight }: SheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { visible: isKeyboardVisible } = useKeyboard(visible);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent presentationStyle="overFullScreen" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.root}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]} />
        <View
          style={[
            styles.panel,
            { backgroundColor: colors.surface, borderTopColor: colors.line, paddingBottom: isKeyboardVisible ? 12 : Math.max(insets.bottom, 16) },
            sheetShadow,
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: colors.strong }]} />

          {label ? (
            <Text variant="label" color={colors.muted} style={styles.label}>
              {label}
            </Text>
          ) : null}

          {title || showClose || headerRight ? (
            <View style={styles.header}>
              <Text variant="title" style={{ flex: 1 }} numberOfLines={2}>
                {title}
              </Text>
              {headerRight}
              {showClose ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={8} onPress={onClose}>
                  <Icon name="close" size={16} color={colors.muted} />
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {scroll ? (
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
              {children}
            </ScrollView>
          ) : (
            <View style={styles.body}>{children}</View>
          )}

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export interface SheetAction {
  label: string;
  icon?: IconName;
  danger?: boolean;
  accent?: boolean;
  onPress: () => void;
}

export function ActionSheet({ visible, onClose, label, actions }: { visible: boolean; onClose: () => void; label?: string; actions: SheetAction[] }) {
  const { colors } = useTheme();

  return (
    <Sheet visible={visible} onClose={onClose} label={label}>
      {actions.map((action, index) => {
        const tone = action.danger ? colors.danger : action.accent ? colors.accent : colors.ink;
        return (
          <Pressable
            key={action.label}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            onPress={() => {
              onClose();
              setTimeout(action.onPress, 120);
            }}
            style={({ pressed }) => [
              styles.row,
              { borderTopColor: colors.line, borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth, backgroundColor: pressed ? colors.subtle : 'transparent' },
            ]}
          >
            {action.icon ? (
              <View style={{ width: 22, alignItems: 'center' }}>
                <Icon name={action.icon} size={15} color={tone} />
              </View>
            ) : null}
            <Text size={15} weight="medium" color={tone} style={{ flex: 1 }}>
              {action.label}
            </Text>
          </Pressable>
        );
      })}
    </Sheet>
  );
}

export function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Sheet visible={visible} onClose={onCancel} title={title}>
      {message ? (
        <Text size={14} color={colors.muted} style={{ marginBottom: 18 }}>
          {message}
        </Text>
      ) : null}
      <View style={styles.buttonRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
          onPress={onCancel}
          style={({ pressed }) => [styles.secondaryButton, { borderColor: colors.strong, opacity: pressed ? 0.75 : 1 }]}
        >
          <Text size={14} weight="semibold" center>
            {cancelLabel}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={confirmLabel}
          onPress={onConfirm}
          style={({ pressed }) => [styles.primaryButton, { backgroundColor: danger ? colors.danger : colors.accentSolid, opacity: pressed ? 0.85 : 1 }]}
        >
          <Text size={14} weight="semibold" color="#FFFFFF" center>
            {confirmLabel}
          </Text>
        </Pressable>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  panel: { maxHeight: '82%', borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, borderTopWidth: StyleSheet.hairlineWidth },
  grabber: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 14, opacity: 0.9 },
  label: { paddingHorizontal: 20, paddingBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 12 },
  body: { paddingHorizontal: 20, paddingBottom: 8 },
  footer: { paddingHorizontal: 20, paddingTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, minHeight: 52 },
  buttonRow: { flexDirection: 'row', gap: 10, paddingBottom: 4 },
  secondaryButton: { flex: 1, borderWidth: 1, borderRadius: radii.lg, paddingVertical: 13, alignItems: 'center' },
  primaryButton: { flex: 1, borderRadius: radii.lg, paddingVertical: 13, alignItems: 'center' },
});