import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { Icon } from './Icon';
import { Text } from './Text';
import type { QuestionStatus } from '../api/types';
import { stripMarkdown } from '../lib/stripMarkdown';
import { timeAgo } from '../lib/time';
import { useTheme } from '../theme';

export function StatusIcon({ status, size = 15 }: { status: QuestionStatus; size?: number }) {
  const { colors } = useTheme();
  if (status === 'SOLVED') return <Icon name="checkCircle" size={size} color={colors.success} />;
  if (status === 'ANSWERED') return <Icon name="messageRegular" size={size} color={colors.accent} />;
  return <Icon name="circle" size={size} color={colors.strong} />;
}

export function StatusLabel({ status }: { status: QuestionStatus }) {
  const { colors } = useTheme();
  const config = {
    SOLVED: { icon: 'checkCircle' as const, iconColor: colors.success, label: 'SOLVED' },
    ANSWERED: { icon: 'messageRegular' as const, iconColor: colors.accent, label: 'ANSWERED' },
    OPEN: { icon: 'circle' as const, iconColor: colors.strong, label: 'OPEN' },
  }[status];

  return (
    <View style={styles.statusRow}>
      <Icon name={config.icon} size={15} color={config.iconColor} />
      <Text size={12} weight="bold" color={status === 'SOLVED' ? colors.success : colors.muted} style={{ letterSpacing: 0.6 }}>
        {config.label}
      </Text>
    </View>
  );
}

export interface QuestionListItem {
  id: string;
  title: string;
  body: string;
  status: QuestionStatus;
  created_at: string;
  is_locked?: boolean;
  hub?: { school: { short_name?: string | null; name?: string | null } } | null;
  department?: { id: string; name: string } | null;
  answer_count?: number;
}

interface QuestionRowProps {
  question: QuestionListItem;
  onPress: () => void;
  showSnippet?: boolean;
  showSchool?: boolean;
  showDepartment?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function QuestionRow({ question, onPress, showSnippet = true, showSchool = true, showDepartment = true, style }: QuestionRowProps) {
  const { colors } = useTheme();
  const school = question.hub?.school?.short_name || question.hub?.school?.name || '';
  const answers = question.answer_count;
  const department = question.department?.name ?? '';
  const snippet = showSnippet ? stripMarkdown(question.body) : '';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={question.title}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { backgroundColor: pressed ? colors.subtle : 'transparent', borderBottomColor: colors.line }, style]}
    >
      <View style={styles.iconColumn}>
        <StatusIcon status={question.status} />
      </View>

      <View style={styles.content}>
        <Text size={14} weight="semibold" numberOfLines={1} style={styles.title}>
          {question.title}
        </Text>
        {snippet ? (
          <Text size={12} color={colors.muted} numberOfLines={1} style={{ marginTop: 1 }}>
            {snippet}
          </Text>
        ) : null}
        <View style={styles.meta}>
          {showSchool && school ? (
            <Text size={11} color={colors.accent} numberOfLines={1}>
              {school}
            </Text>
          ) : null}
          {showDepartment && department ? (
            <Text size={11} color={colors.muted} numberOfLines={1}>
              {department}
            </Text>
          ) : null}
          {typeof answers === 'number' ? (
            <Text size={11} color={colors.muted}>
              {answers} {answers === 1 ? 'answer' : 'answers'}
            </Text>
          ) : null}
          <Text size={11} color={colors.muted}>
            {timeAgo(question.created_at)}
          </Text>
          {question.is_locked ? <Icon name="lock" size={10} color={colors.danger} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  iconColumn: { width: 16, alignItems: 'center', paddingTop: 2 },
  content: { flex: 1, minWidth: 0 },
  title: { lineHeight: 20 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});