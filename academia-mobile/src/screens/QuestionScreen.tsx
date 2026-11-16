import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { errorMessage } from '../api/client';
import { api } from '../api/endpoints';
import type { Answer, QuestionStatus, ReportContentType, VoteType } from '../api/types';
import { useAuth } from '../auth/AuthProvider';
import { Button } from '../components/Button';
import { FormError } from '../components/Form';
import { Icon } from '../components/Icon';
import { KeyboardAvoid } from '../components/KeyboardAvoid';
import { Markdown } from '../components/Markdown';
import { MarkdownEditor } from '../components/MarkdownEditor';
import { OfficialAccountNote, PlatformBadge } from '../components/PlatformBadge';
import { StatusLabel } from '../components/QuestionRow';
import { Screen } from '../components/Screen';
import { ActionSheet, ConfirmSheet, Sheet, SheetAction } from '../components/Sheet';
import { ErrorState, SkeletonQuestionList } from '../components/States';
import { Text } from '../components/Text';
import { TopBar } from '../components/TopBar';
import { webUrl } from '../config/app';
import { AnswerCard } from '../features/answers/AnswerCard';
import { AnswerComposer } from '../features/answers/AnswerComposer';
import { BestAnswerPin } from '../features/answers/BestAnswerPin';
import { useAuthGate } from '../features/auth/AuthGateProvider';
import { CommentsSheet } from '../features/comments/CommentsSheet';
import { ReportForm } from '../features/reports/ReportForm';
import { StaffLockControl } from '../features/staff/StaffLockControl';
import { useCapabilities } from '../features/staff/useCapabilities';
import { pluralize } from '../lib/time';
import { useQuery } from '../lib/useQuery';
import { useRefreshOnFocus } from '../lib/useRefreshOnFocus';
import { navigateRoot, RootStackParamList, startAsk } from '../navigation/types';
import { useTheme } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Question'>;
type ReportTarget = { type: ReportContentType; id: string; escalate: boolean };
type MenuTarget = { type: 'question' | 'answer'; answer?: Answer };
type ConfirmTarget = { type: 'question' | 'answer'; id: string };

const STATUS_TEXT: Record<QuestionStatus, string> = { OPEN: 'Open', ANSWERED: 'Answered', SOLVED: 'Solved' };
const voteValue = (vote: VoteType | null) => (vote === 'UP' ? 1 : vote === 'DOWN' ? -1 : 0);

export function QuestionScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const { questionId, answerId } = useRoute<RouteProp<RootStackParamList, 'Question'>>().params;
  const { user, isAuthenticated } = useAuth();
  const { requireAuth } = useAuthGate();
  const { canModerateHub } = useCapabilities();

  const questionQuery = useQuery((signal) => api.questions.get(questionId, signal), [questionId]);
  const question = questionQuery.data;

  const [answers, setAnswers] = useState<Answer[]>([]);
  const [following, setFollowing] = useState(false);
  const [locked, setLocked] = useState(false);
  const [lockBusy, setLockBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [voteBusy, setVoteBusy] = useState<Record<string, boolean>>({});
  const [flashId, setFlashId] = useState<string | null>(null);

  const [menuTarget, setMenuTarget] = useState<MenuTarget | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [commentsFor, setCommentsFor] = useState<Answer | null>(null);

  const [editAnswer, setEditAnswer] = useState<Answer | null>(null);
  const [editBody, setEditBody] = useState('');
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState<unknown>(null);
  const [officialOpen, setOfficialOpen] = useState(false);

  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const answerPositions = useRef<Record<string, number>>({});
  const answersOffset = useRef(0);
  const pendingAnchor = useRef<string | null>(answerId ?? null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!question) return;
    setAnswers(question.answers ?? []);
    setFollowing(Boolean(question.is_following));
    setLocked(question.is_locked);
  }, [question]);

  useRefreshOnFocus(questionQuery.refetch);

  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    },
    [],
  );

  const patchAnswer = useCallback((id: string, patch: Partial<Answer>) => setAnswers((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item))), []);

  const changeCommentCount = useCallback((id: string, delta: number) => setAnswers((current) => current.map((item) => (item.id === id ? { ...item, comment_count: Math.max(0, (item.comment_count ?? 0) + delta) } : item))), []);

  const jumpTo = useCallback((id: string) => {
    const local = answerPositions.current[id];
    if (typeof local !== 'number') return;
    scrollRef.current?.scrollTo({ y: Math.max(0, answersOffset.current + local - 8), animated: true });
    setFlashId(id);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashId(null), 1600);
  }, []);

  const tryPendingAnchor = () => {
    const id = pendingAnchor.current;
    if (!id || typeof answerPositions.current[id] !== 'number') return;
    pendingAnchor.current = null;
    setTimeout(() => jumpTo(id), 120);
  };

  const back = () => (navigation.canGoBack() ? navigation.goBack() : navigateRoot('Main', { screen: 'Home' }));

  const toggleFollow = () => {
    if (!question) return;
    requireAuth(() => {
      const next = !following;
      setFollowing(next);
      setActionError(null);
      (next ? api.questions.follow(question.id) : api.questions.unfollow(question.id))
        .then((result) => {
          if (result && 'is_following' in result) setFollowing(result.is_following);
        })
        .catch((error) => {
          setFollowing(!next);
          setActionError(errorMessage(error));
        });
    }, 'Sign in to follow this question.');
  };

  const toggleLock = async () => {
    if (!question || lockBusy) return;
    const next = !locked;
    setLockBusy(true);
    setActionError(null);
    try {
      const result = await (next ? api.questions.lock(question.id) : api.questions.unlock(question.id));
      setLocked(result?.is_locked ?? next);
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setLockBusy(false);
    }
  };

  /** Every confirmed server step updates the UI, so a failure on a later step never leaves it wrong. */
  const castVote = async (answer: Answer, type: VoteType | null) => {
    if (!isAuthenticated) return requireAuth(undefined, 'Sign in to vote on answers.');
    if (user?.id === answer.author.id || voteBusy[answer.id]) return;
    setVoteBusy((current) => ({ ...current, [answer.id]: true }));
    setActionError(null);

    const { user_vote: previous, vote_score: score } = answer;
    try {
      if (previous && (type === null || previous === type || type !== previous)) {
        await api.answers.removeVote(answer.id);
        patchAnswer(answer.id, { user_vote: null, vote_score: score - voteValue(previous) });
      }
      if (type && type !== previous) {
        const result = await api.answers.vote(answer.id, type);
        patchAnswer(answer.id, { user_vote: type, vote_score: result.vote_score });
      }
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setVoteBusy((current) => ({ ...current, [answer.id]: false }));
    }
  };

  const markBest = async (answer: Answer) => {
    try {
      await api.answers.markBest(answer.id);
      questionQuery.refetch();
    } catch (error) {
      setActionError(errorMessage(error));
    }
  };

  const openMenu = (target: MenuTarget) => requireAuth(() => setMenuTarget(target), 'Sign in to take action on this content.');

  const openReport = (target: ReportTarget) => {
    setMenuTarget(null);
    setReportTarget(target);
  };

  const confirmDelete = async () => {
    if (!confirmTarget) return;
    try {
      if (confirmTarget.type === 'question') {
        await api.questions.remove(confirmTarget.id);
        setConfirmTarget(null);
        back();
      } else {
        await api.answers.remove(confirmTarget.id);
        setConfirmTarget(null);
        questionQuery.refetch();
      }
    } catch (error) {
      setActionError(errorMessage(error));
      setConfirmTarget(null);
    }
  };

  const saveAnswerEdit = async () => {
    if (!editAnswer || !editBody.trim()) return;
    setEditBusy(true);
    setEditError(null);
    try {
      const updated = await api.answers.update(editAnswer.id, { body: editBody.trim() });
      patchAnswer(updated.id, updated);
      setEditAnswer(null);
    } catch (error) {
      setEditError(error);
    } finally {
      setEditBusy(false);
    }
  };

  const shareQuestion = async () => {
    if (!question) return;
    const facts = [STATUS_TEXT[question.status], pluralize(answers.length, 'answer'), pluralize(question.view_count, 'view')].join(', ');
    const url = webUrl(`/questions/${question.id}${question.slug ? `/${question.slug}` : ''}`);
    try {
      await Share.share({ message: `${question.title}\n${facts}\n${url}` });
    } catch {
      // The user dismissed the share sheet.
    }
  };

  if (questionQuery.error && !question) {
    return (
      <Screen>
        <TopBar title="Question" onBack={back} />
        <ErrorState error={questionQuery.error} onRetry={questionQuery.refetch} />
      </Screen>
    );
  }

  if (!question) {
    return (
      <Screen>
        <TopBar title="Question" onBack={back} />
        <SkeletonQuestionList rows={6} />
      </Screen>
    );
  }

  const mine = user?.id === question.author.id;
  const staff = canModerateHub(question.hub.id);
  const best = answers.find((answer) => answer.is_best) ?? null;

  const menuActions: SheetAction[] = [];
  const reportActions = (type: ReportContentType, id: string) => {
    menuActions.push({ label: 'Report', icon: 'flag', onPress: () => openReport({ type, id, escalate: false }) });
    if (staff) menuActions.push({ label: 'Escalate to admin', icon: 'shield', accent: true, onPress: () => openReport({ type, id, escalate: true }) });
  };
  if (menuTarget?.type === 'question') {
    if (mine) {
      menuActions.push({ label: 'Edit', icon: 'edit', onPress: () => startAsk({ editQuestionId: question.id }) });
      menuActions.push({ label: 'Delete', icon: 'trash', danger: true, onPress: () => setConfirmTarget({ type: 'question', id: question.id }) });
    } else reportActions('question', question.id);
    menuActions.push({ label: 'Share link', icon: 'share', onPress: shareQuestion });
  } else if (menuTarget?.answer) {
    const answer = menuTarget.answer;
    if (answer.author.id === user?.id) {
      menuActions.push({
        label: 'Edit',
        icon: 'edit',
        onPress: () => {
          setEditAnswer(answer);
          setEditBody(answer.body);
          setEditError(null);
        },
      });
      menuActions.push({ label: 'Delete', icon: 'trash', danger: true, onPress: () => setConfirmTarget({ type: 'answer', id: answer.id }) });
    } else reportActions('answer', answer.id);
  }

  return (
    <Screen>
      <TopBar title="Question" onBack={back} />

      <KeyboardAvoid>
        <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }} onContentSizeChange={tryPendingAnchor}>
          <View style={[styles.hero, { borderBottomColor: colors.line }]}>
            <View style={styles.statusRow}>
              <StatusLabel status={question.status} />
              {locked ? (
                <View style={styles.lockedRow}>
                  <Icon name="lock" size={11} color={colors.danger} />
                  <Text size={12} color={colors.danger}>
                    Locked
                  </Text>
                </View>
              ) : null}
            </View>

            <Text variant="h1" style={{ marginTop: 8, marginBottom: 10 }}>
              {question.title}
            </Text>

            <View style={styles.meta}>
              <View style={styles.metaItem}>
                <Icon name="userRegular" size={12} color={colors.muted} />
                <Text size={12} color={colors.muted}>
                  Asked by {question.author.full_name}
                </Text>
                <PlatformBadge userId={question.author.id} onPress={() => setOfficialOpen(true)} />
              </View>
              <Pressable accessibilityRole="link" accessibilityLabel={`Open ${question.hub.school.name}`} hitSlop={6} onPress={() => navigateRoot('School', { schoolId: question.hub.school.id })} style={styles.metaItem}>
                <Icon name="building" size={12} color={colors.accent} />
                <Text size={12} color={colors.accent}>
                  {question.hub.school.short_name}
                </Text>
              </Pressable>
              {question.department ? (
                <View style={styles.metaItem}>
                  <Icon name="tag" size={12} color={colors.muted} />
                  <Text size={12} color={colors.muted}>
                    {question.department.name}
                  </Text>
                </View>
              ) : null}
              <View style={styles.metaItem}>
                <Icon name="eye" size={12} color={colors.muted} />
                <Text size={12} color={colors.muted}>
                  {pluralize(question.view_count, 'view')}
                </Text>
              </View>
            </View>

            {question.tags.length > 0 ? (
              <View style={styles.tags}>
                {question.tags.map((tag) => (
                  <Pressable key={tag} accessibilityRole="button" accessibilityLabel={`Tag ${tag}`} onPress={() => navigateRoot('TagQuestions', { tag })} style={({ pressed }) => [styles.tag, { backgroundColor: colors.subtle, opacity: pressed ? 0.7 : 1 }]}>
                    <Text size={11} color={colors.muted}>
                      {tag}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <Markdown markdown={question.body} />

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={following ? 'Following' : 'Follow'}
                onPress={toggleFollow}
                style={({ pressed }) => [styles.follow, { backgroundColor: following ? colors.accentSolid : colors.subtle, opacity: pressed ? 0.75 : 1 }]}
              >
                <Icon name="bell" family={following ? 'solid' : 'regular'} size={13} color={following ? '#FFFFFF' : colors.ink} />
                <Text size={12} weight="semibold" color={following ? '#FFFFFF' : colors.ink}>
                  {following ? 'Following' : 'Follow'}
                </Text>
              </Pressable>

              <StaffLockControl hubId={question.hub.id} locked={locked} busy={lockBusy} onPress={toggleLock} />

              <Pressable accessibilityRole="button" accessibilityLabel="More actions" onPress={() => openMenu({ type: 'question' })} style={({ pressed }) => [styles.kebab, { backgroundColor: colors.subtle, opacity: pressed ? 0.7 : 1 }]}>
                <Icon name="ellipsisVertical" size={15} color={colors.muted} />
              </Pressable>
            </View>

            {actionError ? (
              <Text size={12} color={colors.danger} style={{ marginTop: 8 }}>
                {actionError}
              </Text>
            ) : null}
          </View>

          {best ? <BestAnswerPin answer={best} onJump={() => jumpTo(best.id)} onOfficial={() => setOfficialOpen(true)} /> : null}

          <View style={styles.answers} onLayout={(event: LayoutChangeEvent) => { answersOffset.current = event.nativeEvent.layout.y; }}>
            <Text variant="label" color={colors.muted} style={{ marginBottom: 12 }}>
              {pluralize(answers.length, 'answer')}
            </Text>

            {answers.length === 0 ? (
              <View style={[styles.noAnswers, { borderColor: colors.strong }]}>
                <Text size={14} weight="semibold" center>
                  No answers yet
                </Text>
                <Text size={14} color={colors.muted} center style={{ marginTop: 4 }}>
                  Be the first to help.
                </Text>
              </View>
            ) : (
              answers.map((answer) => (
                <AnswerCard
                  key={answer.id}
                  answer={answer}
                  canMarkBest={mine}
                  flashing={flashId === answer.id}
                  voteBusy={Boolean(voteBusy[answer.id])}
                  onLayout={(event) => {
                    answerPositions.current[answer.id] = event.nativeEvent.layout.y;
                    if (pendingAnchor.current === answer.id) tryPendingAnchor();
                  }}
                  onVote={castVote}
                  onMenu={(item) => openMenu({ type: 'answer', answer: item })}
                  onComments={setCommentsFor}
                  onMarkBest={markBest}
                  onOfficial={() => setOfficialOpen(true)}
                />
              ))
            )}
          </View>
        </ScrollView>

        <AnswerComposer questionId={question.id} locked={locked} onPosted={questionQuery.refetch} />
      </KeyboardAvoid>

      <ActionSheet visible={Boolean(menuTarget)} onClose={() => setMenuTarget(null)} label={menuTarget?.type === 'answer' ? 'This answer' : 'This question'} actions={menuActions} />

      <Sheet visible={Boolean(reportTarget)} onClose={() => setReportTarget(null)}>
        {reportTarget ? <ReportForm key={`${reportTarget.type}-${reportTarget.id}-${reportTarget.escalate}`} contentType={reportTarget.type} contentId={reportTarget.id} escalate={reportTarget.escalate} onClose={() => setReportTarget(null)} /> : null}
      </Sheet>

      <CommentsSheet answer={commentsFor} hubId={question.hub.id} onClose={() => setCommentsFor(null)} onCountChange={changeCommentCount} />

      <Sheet visible={Boolean(editAnswer)} onClose={() => setEditAnswer(null)} title="Edit answer">
        <FormError message={editError ? errorMessage(editError) : null} />
        <MarkdownEditor value={editBody} onChangeText={setEditBody} minHeight={120} />
        <View style={styles.sheetButtons}>
          <Button title="Cancel" variant="secondary" onPress={() => setEditAnswer(null)} style={{ flex: 1 }} />
          <Button title="Save" onPress={saveAnswerEdit} loading={editBusy} disabled={!editBody.trim()} style={{ flex: 1 }} />
        </View>
      </Sheet>

      <ConfirmSheet visible={Boolean(confirmTarget)} title={`Delete this ${confirmTarget?.type ?? 'item'}?`} message="This can't be undone." confirmLabel="Delete" danger onCancel={() => setConfirmTarget(null)} onConfirm={confirmDelete} />

      <Sheet visible={officialOpen} onClose={() => setOfficialOpen(false)} title="Official Academia Atlas account">
        <OfficialAccountNote />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lockedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 6, marginBottom: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tag: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  follow: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, minHeight: 36 },
  kebab: { marginLeft: 'auto', width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  answers: { paddingHorizontal: 16, paddingTop: 16 },
  noAnswers: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 12, paddingVertical: 24, alignItems: 'center' },
  sheetButtons: { flexDirection: 'row', gap: 10, marginTop: 16 },
});