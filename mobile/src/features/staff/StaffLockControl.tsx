import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Icon } from '../../components/Icon';
import { Text } from '../../components/Text';
import { useTheme } from '../../theme';
import { useCapabilities } from './useCapabilities';

export function StaffLockControl({ hubId, locked, busy = false, onPress }: { hubId: string | null | undefined; locked: boolean; busy?: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  const { canModerateHub } = useCapabilities();

  if (!canModerateHub(hubId)) return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={locked ? 'Unlock question' : 'Lock question'}
      accessibilityState={{ disabled: busy, busy }}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [styles.pill, { backgroundColor: locked ? colors.dangerSoft : colors.subtle, opacity: busy ? 0.5 : pressed ? 0.7 : 1 }]}
    >
      <Icon name={locked ? 'lockOpen' : 'lock'} size={12} color={locked ? colors.danger : colors.ink} />
      <Text size={12} weight="semibold" color={locked ? colors.danger : colors.ink}>
        {locked ? 'Unlock' : 'Lock'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, minHeight: 36 },
});