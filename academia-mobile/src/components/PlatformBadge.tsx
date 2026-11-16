import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from './Text';
import { isPlatformAccount } from '../config/app';
import { useTheme } from '../theme';

/** The "A" mark for Academia's own account. Renders nothing for anyone else. */
export function PlatformBadge({ userId, onPress }: { userId?: string | null; onPress?: () => void }) {
  const { colors } = useTheme();
  if (!userId || !isPlatformAccount(userId)) return null;

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'image'}
      accessibilityLabel="Official Academia Atlas account"
      disabled={!onPress}
      hitSlop={8}
      onPress={onPress}
      style={[styles.badge, { backgroundColor: colors.accentSolid }]}
    >
      <Text size={9} weight="extrabold" color="#FFFFFF">
        A
      </Text>
    </Pressable>
  );
}

/** Explanation shown when the badge is tapped. Used inside a sheet by each screen. */
export function OfficialAccountNote() {
  const { colors } = useTheme();
  return (
    <Text size={14} color={colors.muted}>
      This content was posted by Academia Atlas&apos; own team, not a regular student account.
    </Text>
  );
}

const styles = StyleSheet.create({
  badge: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});