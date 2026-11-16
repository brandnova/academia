import React from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { Icon } from './Icon';
import { Text } from './Text';
import { pluralize } from '../lib/time';
import { useTheme } from '../theme';

export function TagRow({ name, count, onPress, style }: { name: string; count: number; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  const label = pluralize(count, 'question');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${label}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { borderBottomColor: colors.line, backgroundColor: pressed ? colors.subtle : 'transparent' }, style]}
    >
      <Text size={14} color={colors.ink} style={{ flex: 1 }}>
        {name}
      </Text>
      <Text size={12} color={colors.muted}>
        {label}
      </Text>
      <Icon name="chevronRight" size={12} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, minHeight: 52 },
});