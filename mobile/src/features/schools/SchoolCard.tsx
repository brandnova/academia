import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ApiError } from '../../api/client';
import { api } from '../../api/endpoints';
import type { Hub, School } from '../../api/types';
import { Icon } from '../../components/Icon';
import { Text } from '../../components/Text';
import { useQuery } from '../../lib/useQuery';
import { useTheme } from '../../theme';

export const SCHOOL_CARD_WIDTH = 208;
export const SCHOOL_CARD_HEIGHT = 150;

/** Home strip card. The tile is where a per-school logo will go. */
export function SchoolCard({ school, refreshKey = 0, onPress }: { school: School; refreshKey?: number; onPress: () => void }) {
  const { colors } = useTheme();
  const hub = useQuery<Hub | null>(
    async (signal) => {
      try {
        return await api.hubs.bySchool(school.id, signal);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
    [school.id, refreshKey],
  );
  const count = hub.data?.question_count;
  const where = school.location ?? school.state ?? 'Nigeria';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${school.name}${typeof count === 'number' ? `, ${count} ${count === 1 ? 'question' : 'questions'}` : ''}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: colors.line, opacity: pressed ? 0.75 : 1 }]}
    >
      <View style={styles.top}>
        <View style={[styles.tile, { backgroundColor: colors.accentSoft }]}>
          <Icon name="building" size={18} color={colors.accent} />
        </View>
        <View style={styles.stat}>
          <Text size={20} weight="extrabold" color={colors.accent} style={{ lineHeight: 24 }}>
            {typeof count === 'number' ? count : '-'}
          </Text>
          <Text size={10} color={colors.muted}>
            {count === 1 ? 'question' : 'questions'}
          </Text>
        </View>
      </View>

      <Text size={16} weight="extrabold" numberOfLines={1} style={{ marginTop: 10 }}>
        {school.short_name}
      </Text>
      <Text size={11} color={colors.muted} numberOfLines={2} style={{ marginTop: 2, flex: 1 }}>
        {school.name}
      </Text>

      <View style={[styles.footer, { borderTopColor: colors.line }]}>
        <Icon name="location" size={10} color={colors.muted} />
        <Text size={11} color={colors.muted} numberOfLines={1} style={{ flex: 1 }}>
          {where}
        </Text>
        <Icon name="chevronRight" size={10} color={colors.muted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: SCHOOL_CARD_WIDTH, height: SCHOOL_CARD_HEIGHT, borderWidth: 1, borderRadius: 12, padding: 12 },
  top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  tile: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stat: { alignItems: 'flex-end' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth },
});