import React from 'react';
import { Pressable, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { Icon, IconName } from './Icon';
import { Text } from './Text';
import { radii, useTheme } from '../theme';

export interface ChipOption {
  label: string;
  value: string;
}

type ChipVariant = 'solid' | 'outline' | 'plain';

/** One chip. solid: filled when active. outline: accent border when active. plain: never shows an active state. */
export function Chip({ label, active = false, variant = 'solid', iconRight, onPress, accessibilityLabel }: { label: string; active?: boolean; variant?: ChipVariant; iconRight?: IconName; onPress?: () => void; accessibilityLabel?: string }) {
  const { colors } = useTheme();
  const on = active && variant !== 'plain';
  const filled = on && variant === 'solid';
  const color = filled ? '#FFFFFF' : on ? colors.accent : variant === 'plain' ? colors.ink : colors.muted;
  const border = filled ? colors.accentSolid : on ? colors.accent : variant === 'outline' ? colors.line : colors.strong;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: on }}
      hitSlop={{ top: 5, bottom: 5 }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, { backgroundColor: filled ? colors.accentSolid : 'transparent', borderColor: border, opacity: pressed ? 0.7 : 1 }]}
    >
      <Text size={12} weight="medium" color={color}>
        {label}
      </Text>
      {iconRight ? <Icon name={iconRight} size={10} color={color} /> : null}
    </Pressable>
  );
}

/** A row of single-select chips. Horizontal scroll by default, wrapping with `wrap`. allowClear makes a second tap on the active chip return ''. */
export function FilterChips({ options, value, onChange, variant = 'solid', wrap = false, allowClear = false, style }: { options: ChipOption[]; value: string; onChange: (value: string) => void; variant?: ChipVariant; wrap?: boolean; allowClear?: boolean; style?: StyleProp<ViewStyle> }) {
  const chips = options.map((option) => <Chip key={option.value} label={option.label} variant={variant} active={option.value === value} onPress={() => onChange(allowClear && option.value === value ? '' : option.value)} />);

  if (wrap) return <View style={[styles.row, styles.wrap, style]}>{chips}</View>;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={styles.hScroll} contentContainerStyle={[styles.row, style]}>
      {chips}
    </ScrollView>
  );
}

export function SegmentedTabs({ options, value, onChange, scroll, style }: { options: string[]; value: string; onChange: (value: string) => void; scroll?: boolean; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  const content = options.map((option) => {
    const active = option === value;
    return (
      <Pressable
        key={option}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        onPress={() => onChange(option)}
        style={({ pressed }) => [styles.tab, { backgroundColor: active ? colors.accentSolid : colors.surface, borderColor: active ? colors.accentSolid : colors.line, opacity: pressed ? 0.8 : 1 }]}
      >
        <Text size={12} weight={active ? 'semibold' : 'medium'} color={active ? '#FFFFFF' : colors.muted}>
          {option}
        </Text>
      </Pressable>
    );
  });

  if (scroll) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll} contentContainerStyle={[styles.row, style]}>
        {content}
      </ScrollView>
    );
  }
  return <View style={[styles.row, style]}>{content}</View>;
}

export function TagPill({ name, count, active, onPress }: { name: string; count?: number; active?: boolean; onPress?: () => void }) {
  const { colors } = useTheme();
  const content = (
    <>
      <Text size={12} color={active ? '#FFFFFF' : colors.ink}>
        {name}
      </Text>
      {typeof count === 'number' ? (
        <Text size={11} color={active ? 'rgba(255,255,255,0.75)' : colors.muted}>
          {count}
        </Text>
      ) : null}
    </>
  );

  if (!onPress) return <View style={[styles.pill, { backgroundColor: colors.surface, borderColor: colors.line }]}>{content}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Tag ${name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.pill, { backgroundColor: active ? colors.accentSolid : colors.surface, borderColor: active ? colors.accentSolid : colors.line, opacity: pressed ? 0.8 : 1 }]}
    >
      {content}
    </Pressable>
  );
}

export function TopicChip({ label, onPress }: { label: string; onPress?: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.pill, { backgroundColor: colors.surface, borderColor: colors.line, opacity: pressed ? 0.8 : 1 }]}>
      <Text size={12} color={colors.ink}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'accent' | 'success' | 'danger' }) {
  const { colors } = useTheme();
  const palette = {
    neutral: { bg: colors.subtle, fg: colors.muted },
    accent: { bg: colors.accentSoft, fg: colors.accent },
    success: { bg: colors.successSoft, fg: colors.success },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
  }[tone];

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text size={10} weight="bold" color={palette.fg} style={{ letterSpacing: 0.4 }}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hScroll: { flexGrow: 0, flexShrink: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 },
  wrap: { flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 6, minHeight: 34 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: radii.sm, paddingHorizontal: 11, paddingVertical: 7 },
  tab: { borderWidth: 1, borderRadius: radii.sm, paddingHorizontal: 13, paddingVertical: 7, alignItems: 'center' },
  badge: { alignSelf: 'flex-start', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
});