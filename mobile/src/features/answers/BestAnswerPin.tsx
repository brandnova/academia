import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Answer } from '../../api/types';
import { Icon } from '../../components/Icon';
import { Markdown } from '../../components/Markdown';
import { PlatformBadge } from '../../components/PlatformBadge';
import { Text } from '../../components/Text';
import { useTheme } from '../../theme';

/** Compact read-only preview of the best answer, with a jump to the full card. */
export function BestAnswerPin({ answer, onJump, onOfficial }: { answer: Answer; onJump: () => void; onOfficial: () => void }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.pin, { backgroundColor: colors.isDark ? 'rgba(52, 84, 209, 0.14)' : 'rgba(52, 84, 209, 0.06)', borderBottomColor: colors.line }]}>
      <View style={styles.label}>
        <Icon name="award" size={13} color={colors.accent} />
        <Text size={12} weight="bold" color={colors.accent} style={{ letterSpacing: 0.6 }}>
          BEST ANSWER
        </Text>
      </View>
      <View style={{ maxHeight: 116, overflow: 'hidden', marginTop: 6 }}>
        <Markdown markdown={answer.body} compact />
      </View>
      <View style={styles.footer}>
        <View style={styles.by}>
          <Icon name="thumbsUpRegular" size={12} color={colors.muted} />
          <Text size={12} color={colors.muted} numberOfLines={1} style={{ flexShrink: 1 }}>
            {answer.vote_score} · {answer.author.full_name}
          </Text>
          <PlatformBadge userId={answer.author.id} onPress={onOfficial} />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="View best answer in list" onPress={onJump} style={styles.jump}>
          <Text size={12} color={colors.accent} weight="medium">
            View in list
          </Text>
          <Icon name="arrowDown" size={10} color={colors.accent} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pin: { paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  label: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 8 },
  by: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1, minWidth: 0 },
  jump: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});