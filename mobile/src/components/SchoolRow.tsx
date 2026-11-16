import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { Icon } from './Icon';
import { Text } from './Text';
import { useTheme } from '../theme';
import type { School } from '../api/types';

interface Props {
  school: Pick<School, 'id' | 'name' | 'short_name' | 'has_hub' | 'location'>;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export function SchoolRow({ school, onPress, style }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={school.name}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? colors.subtle : 'transparent',
          borderBottomColor: colors.line,
        },
        style,
      ]}
    >
      <Icon
        name={school.has_hub ? 'checkCircle' : 'circle'}
        size={16}
        color={school.has_hub ? colors.accent : colors.strong}
      />
      <View style={styles.body}>
        <Text size={14} weight="semibold" numberOfLines={1}>
          {school.name}
        </Text>
        <Text size={12} color={colors.muted} numberOfLines={1}>
          {school.short_name}
          {school.location ? ` · ${school.location}` : ''}
        </Text>
      </View>
      <Text size={11} color={colors.muted} numberOfLines={1}>
        {school.has_hub ? 'Hub active' : 'No hub yet'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 62,
  },
  body: { flex: 1, minWidth: 0, gap: 1 },
});
