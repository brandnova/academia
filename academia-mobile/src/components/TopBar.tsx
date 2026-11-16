import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { BrandMark } from './BrandMark';
import { Icon, IconName } from './Icon';
import { Text } from './Text';
import { BRAND } from '../config/brand';
import { useDrawer } from '../navigation/DrawerProvider';
import { touchTarget, useTheme } from '../theme';

interface TopBarProps {
  title?: string;
  wordmark?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
  style?: ViewStyle;
  showBorder?: boolean;
}

/** Shared header. Root screens get the menu, detail screens get a back arrow. */
export function TopBar({ title, wordmark = false, onBack, right, style, showBorder = true }: TopBarProps) {
  const { colors } = useTheme();
  const drawer = useDrawer();

  return (
    <View style={[styles.bar, showBorder && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line }, style]}>
      <Pressable accessibilityRole="button" accessibilityLabel={onBack ? 'Back' : 'Menu'} onPress={onBack ?? drawer.open} hitSlop={4} style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.55 : 1 }]}>
        <Icon name={onBack ? 'arrowLeft' : 'menu'} size={20} color={colors.muted} />
      </Pressable>

      {wordmark ? (
        <View style={styles.brand}>
          <BrandMark width={28} />
          <Text size={15} weight="extrabold" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} maxFontSizeMultiplier={1.1} accessibilityRole="header" style={{ letterSpacing: -0.3, flexShrink: 1 }}>
            {BRAND.name}
          </Text>
        </View>
      ) : (
        <Text size={14} weight="bold" numberOfLines={1} accessibilityRole="header" style={{ flex: 1 }}>
          {title ?? ''}
        </Text>
      )}

      <View style={styles.right}>{right}</View>
    </View>
  );
}

export function HeaderIconButton({ icon, accessibilityLabel, onPress, color }: { icon: IconName; accessibilityLabel: string; onPress: () => void; color?: string }) {
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} hitSlop={4} style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.55 : 1 }]}>
      <Icon name={icon} size={18} color={color ?? colors.muted} />
    </Pressable>
  );
}

export function HeaderTextButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={6} style={({ pressed }) => [styles.textButton, { opacity: pressed ? 0.55 : 1 }]}>
      <Text size={12} weight="medium" color={colors.accent}>
        {label}
      </Text>
    </Pressable>
  );
}

export function SectionHeader({ title, actionLabel, onAction, style }: { title: string; actionLabel?: string; onAction?: () => void; style?: ViewStyle }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.section, style]}>
      <Text variant="label" color={colors.muted} style={{ flex: 1 }}>
        {title}
      </Text>
      {actionLabel && onAction ? (
        <Pressable hitSlop={8} onPress={onAction} accessibilityRole="button">
          <Text size={12} weight="medium" color={colors.accent}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingTop: 4, paddingBottom: 8, minHeight: 52 },
  iconButton: { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  right: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center' },
  textButton: { minHeight: touchTarget, paddingHorizontal: 8, justifyContent: 'center' },
  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8 },
});