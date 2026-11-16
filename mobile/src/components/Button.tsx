import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';

import { Icon, IconName } from './Icon';
import { Text } from './Text';
import { fonts, radii, useTheme } from '../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dangerSoft' | 'accentSoft';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface Props {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const HEIGHTS: Record<ButtonSize, number> = { sm: 36, md: 44, lg: 50 };
const TEXT_SIZES: Record<ButtonSize, number> = { sm: 12, md: 14, lg: 15 };
const PADDING: Record<ButtonSize, number> = { sm: 12, md: 16, lg: 18 };

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading,
  disabled,
  fullWidth,
  style,
  accessibilityLabel,
}: Props) {
  const { colors } = useTheme();

  const palette = {
    primary: { bg: colors.accentSolid, border: 'transparent', fg: '#FFFFFF' },
    secondary: { bg: colors.surface, border: colors.strong, fg: colors.ink },
    ghost: { bg: 'transparent', border: 'transparent', fg: colors.ink },
    danger: { bg: colors.danger, border: 'transparent', fg: '#FFFFFF' },
    dangerSoft: { bg: colors.dangerSoft, border: 'transparent', fg: colors.danger },
    accentSoft: { bg: colors.accentSoft, border: 'transparent', fg: colors.accent },
  }[variant];

  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: Boolean(inactive), busy: Boolean(loading) }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          minHeight: HEIGHTS[size],
          paddingHorizontal: PADDING[size],
          opacity: inactive ? 0.55 : pressed ? 0.92 : 1,
          transform: [{ scale: pressed && !inactive ? 0.98 : 1 }],
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={TEXT_SIZES[size] + 1} color={palette.fg} /> : null}
          <Text
            size={TEXT_SIZES[size]}
            weight="semibold"
            color={palette.fg}
            style={{ fontFamily: fonts.semibold }}
          >
            {title}
          </Text>
          {iconRight ? <Icon name={iconRight} size={TEXT_SIZES[size] + 1} color={palette.fg} /> : null}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radii.md,
    borderWidth: 1,
  },
});

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  size = 20,
  color,
  style,
  disabled,
}: {
  icon: IconName;
  onPress?: () => void;
  accessibilityLabel: string;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        iconStyles.iconButton,
        { opacity: disabled ? 0.4 : pressed ? 0.6 : 1 },
        style,
      ]}
    >
      <Icon name={icon} size={size} color={color ?? colors.ink} />
    </Pressable>
  );
}

const iconStyles = StyleSheet.create({
  iconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
