import React from 'react';
import {
  KeyboardTypeOptions,
  StyleProp,
  StyleSheet,
  Pressable,
  Switch,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

import { Icon } from './Icon';
import { Text } from './Text';
import { fonts, radii, useTheme, webInputReset } from '../theme';

export function Field({
  label,
  hint,
  error,
  children,
  style,
}: {
  label?: string;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <View style={[{ marginBottom: 14 }, style]}>
      {label ? (
        <Text size={12} weight="semibold" color={colors.textMuted} style={{ marginBottom: 6 }}>
          {label}
        </Text>
      ) : null}
      {children}
      {error ? (
        <Text size={11} color={colors.danger} style={{ marginTop: 5 }}>
          {error}
        </Text>
      ) : hint ? (
        <Text size={11} color={colors.textFaint} style={{ marginTop: 5 }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string | null;
  hint?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({ label, error, hint, containerStyle, ...rest }: InputProps) {
  const { colors } = useTheme();
  return (
    <Field label={label} error={error} hint={hint} style={containerStyle}>
      <TextInput
        placeholderTextColor={colors.textFaint}
        {...rest}
        style={[
          styles.input,
          webInputReset,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.border,
            color: colors.text,
          },
        ]}
      />
    </Field>
  );
}

export function TextArea({
  label,
  error,
  minHeight = 110,
  ...rest
}: InputProps & { minHeight?: number }) {
  const { colors } = useTheme();
  return (
    <Field label={label} error={error}>
      <TextInput
        placeholderTextColor={colors.textFaint}
        multiline
        textAlignVertical="top"
        {...rest}
        style={[
          styles.input,
          styles.textArea,
          webInputReset,
          {
            minHeight,
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.border,
            color: colors.text,
          },
        ]}
      />
    </Field>
  );
}

export function SelectRow({
  label,
  value,
  placeholder = 'Select...',
  onPress,
  disabled,
  error,
}: {
  label?: string;
  value?: string | null;
  placeholder?: string;
  onPress: () => void;
  disabled?: boolean;
  error?: string | null;
}) {
  const { colors } = useTheme();
  return (
    <Field label={label} error={error}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label ?? 'Select'}: ${value ?? placeholder}`}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.input,
          styles.select,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: disabled ? 0.55 : pressed ? 0.8 : 1,
          },
        ]}
      >
        <Text size={14} color={value ? colors.text : colors.textFaint} numberOfLines={1} style={{ flex: 1 }}>
          {value ?? placeholder}
        </Text>
        <Icon name="chevronDown" size={11} color={colors.textFaint} />
      </Pressable>
    </Field>
  );
}

export function ToggleRow({
  label,
  description,
  value,
  onValueChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text size={14} weight="medium">
          {label}
        </Text>
        {description ? (
          <Text size={11} color={colors.textMuted} style={{ marginTop: 2 }}>
            {description}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.surfaceSunken, true: colors.accentSolid }}
        thumbColor="#FFFFFF"
        accessibilityLabel={label}
      />
    </View>
  );
}

export function FormError({ message }: { message?: string | null }) {
  const { colors } = useTheme();
  if (!message) return null;
  return (
    <View style={[styles.errorBox, { backgroundColor: colors.dangerSoft }]}>
      <Icon name="warning" size={13} color={colors.danger} />
      <Text size={12} color={colors.danger} style={{ flex: 1 }}>
        {message}
      </Text>
    </View>
  );
}

export const keyboardTypes: Record<string, KeyboardTypeOptions> = {
  email: 'email-address',
  url: 'url',
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    minHeight: 44,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  textArea: { paddingTop: 12, lineHeight: 21 },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
});
