import React from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';

import type { Answer, VoteType } from '../../api/types';
import { useAuth } from '../../auth/AuthProvider';
import { Icon } from '../../components/Icon';
import { Markdown } from '../../components/Markdown';
import { PlatformBadge } from '../../components/PlatformBadge';
import { Text } from '../../components/Text';
import { touchTarget, useTheme } from '../../theme';

interface AnswerCardProps {
  answer: Answer;
  canMarkBest: boolean;
  flashing: boolean;
  voteBusy: boolean;
  onLayout: (event: LayoutChangeEvent) => void;
  onVote: (answer: Answer, type: VoteType | null) => void;
  onMenu: (answer: Answer) => void;
  onComments: (answer: Answer) => void;
  onMarkBest: (answer: Answer) => void;
  onOfficial: () => void;
}

/** One answer: byline, body, vote controls, comments link, mark best. */
export function AnswerCard({ answer, canMarkBest, flashing, voteBusy, onLayout, onVote, onMenu, onComments, onMarkBest, onOfficial }: AnswerCardProps) {
  const { colors } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const own = answer.author.id === user?.id;

  return (
    <View onLayout={onLayout} style={[styles.card, { borderColor: flashing ? colors.accent : colors.line, borderWidth: flashing ? 2 : 1 }]}>
      <View style={styles.byline}>
        <View style={styles.bylineLeft}>
          <Icon name="userRegular" size={12} color={colors.muted} />
          <Text size={12} color={colors.muted}>
            by {answer.author.full_name}
          </Text>
          <PlatformBadge userId={answer.author.id} onPress={onOfficial} />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="More actions" onPress={() => onMenu(answer)} style={styles.kebab}>
          <Icon name="ellipsisVertical" size={13} color={colors.muted} />
        </Pressable>
      </View>

      <Markdown markdown={answer.body} compact />

      <View style={styles.footer}>
        <View style={styles.voteRow}>
          {own || !isAuthenticated ? (
            <View style={styles.voteStatic}>
              <Icon name="thumbsUpRegular" size={13} color={colors.muted} />
              <Text size={12} color={colors.muted}>
                {answer.vote_score}
              </Text>
            </View>
          ) : answer.user_vote ? (
            <View style={styles.voteStatic}>
              <Icon name={answer.user_vote === 'UP' ? 'thumbsUp' : 'thumbsDown'} size={13} color={answer.user_vote === 'UP' ? colors.accent : colors.danger} />
              <Text size={12} color={colors.accent}>
                {answer.vote_score}
              </Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Remove vote" onPress={() => onVote(answer, null)} hitSlop={6}>
                <Text size={12} color={colors.muted}>
                  Remove vote
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.voteButtons}>
              <Pressable accessibilityRole="button" accessibilityLabel="Upvote" disabled={voteBusy} onPress={() => onVote(answer, 'UP')} style={styles.voteButton}>
                <Icon name="thumbsUpRegular" size={14} color={colors.muted} />
              </Pressable>
              <Text size={12} color={colors.muted}>
                {answer.vote_score}
              </Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Downvote" disabled={voteBusy} onPress={() => onVote(answer, 'DOWN')} style={styles.voteButton}>
                <Icon name="thumbsDownRegular" size={14} color={colors.muted} />
              </Pressable>
            </View>
          )}
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel="Comments" onPress={() => onComments(answer)} hitSlop={6}>
          <Text size={12} weight="medium" color={colors.accent}>
            {answer.comment_count ? `Comments (${answer.comment_count})` : 'Add a comment'}
          </Text>
        </Pressable>
      </View>

      {canMarkBest && !answer.is_best ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mark as best answer"
          onPress={() => onMarkBest(answer)}
          style={({ pressed }) => [styles.markBest, { borderColor: colors.accent, opacity: pressed ? 0.7 : 1 }]}
        >
          <Icon name="award" size={12} color={colors.accent} />
          <Text size={12} weight="semibold" color={colors.accent}>
            Mark as best answer
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 8, padding: 12, marginBottom: 12 },
  byline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  bylineLeft: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1, flexWrap: 'wrap' },
  kebab: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 8 },
  voteRow: { flexDirection: 'row', alignItems: 'center' },
  voteStatic: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  voteButtons: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  voteButton: { width: touchTarget, height: 36, alignItems: 'center', justifyContent: 'center' },
  markBest: { marginTop: 12, borderWidth: 1, borderRadius: 8, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 40 },
});