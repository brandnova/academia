import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { errorMessage } from '../../api/client';
import { api } from '../../api/endpoints';
import type { Answer, Comment, UUID } from '../../api/types';
import { useAuth } from '../../auth/AuthProvider';
import { Button } from '../../components/Button';
import { FormError } from '../../components/Form';
import { Icon, IconName } from '../../components/Icon';
import { OfficialAccountNote, PlatformBadge } from '../../components/PlatformBadge';
import { Sheet } from '../../components/Sheet';
import { ErrorState } from '../../components/States';
import { Text } from '../../components/Text';
import { timeAgo } from '../../lib/time';
import { useTheme, webInputReset } from '../../theme';
import { ReportForm } from '../reports/ReportForm';
import { useCapabilities } from '../staff/useCapabilities';

type Mode =
  | { kind: 'list' }
  | { kind: 'menu'; comment: Comment }
  | { kind: 'edit'; comment: Comment }
  | { kind: 'delete'; comment: Comment }
  | { kind: 'report'; comment: Comment; escalate: boolean }
  | { kind: 'official' };

interface CommentsSheetProps {
  answer: Answer | null;
  hubId: UUID;
  onClose: () => void;
  onCountChange: (answerId: UUID, delta: number) => void;
}

const PAGE_SIZE = 20;

/**
 * Comment thread for one answer. Menu, edit, delete, report and the official
 * account note all render inside this one sheet (no stacked modals, which are
 * unreliable on older Android). Own comments: Edit and Delete. Others: Report,
 * plus Escalate for hub staff.
 */
export function CommentsSheet({ answer, hubId, onClose, onCountChange }: CommentsSheetProps) {
  const { colors } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { canModerateHub } = useCapabilities();
  const staff = canModerateHub(hubId);

  const [comments, setComments] = useState<Comment[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [moreError, setMoreError] = useState<unknown>(null);

  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<unknown>(null);

  const [mode, setMode] = useState<Mode>({ kind: 'list' });
  const [editDraft, setEditDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const requestId = useRef(0);
  const answerId = answer?.id ?? null;

  const load = useCallback(async (id: UUID, pageNumber: number) => {
    const current = ++requestId.current;
    if (pageNumber === 1) setLoading(true);
    else setLoadingMore(true);
    setError(null);
    setMoreError(null);
    try {
      const result = await api.comments.list(id, { page: pageNumber, page_size: PAGE_SIZE });
      if (current !== requestId.current) return;
      setComments((existing) => (pageNumber === 1 ? result.results : [...existing, ...result.results.filter((item) => !existing.some((old) => old.id === item.id))]));
      setPage(pageNumber);
      setHasMore(Boolean(result.next));
    } catch (err) {
      if (current !== requestId.current) return;
      if (pageNumber === 1) setError(err);
      else setMoreError(err);
    } finally {
      if (current === requestId.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    requestId.current += 1;
    setMode({ kind: 'list' });
    setComments([]);
    setPage(1);
    setHasMore(false);
    setError(null);
    setMoreError(null);
    setDraft('');
    setPostError(null);
    setActionError(null);
    setLoading(false);
    if (answerId) void load(answerId, 1);
  }, [answerId, load]);

  const mine = (comment: Comment) => Boolean(user && comment.author.id === user.id);
  const backToList = () => {
    setActionError(null);
    setMode({ kind: 'list' });
  };

  const submitComment = async () => {
    const body = draft.trim();
    if (!answer || !body || posting) return;
    setPosting(true);
    setPostError(null);
    try {
      const created = await api.comments.create({ answer_id: answer.id, body });
      setComments((existing) => [...existing, created]);
      setDraft('');
      onCountChange(answer.id, 1);
    } catch (err) {
      setPostError(err);
    } finally {
      setPosting(false);
    }
  };

  const saveEdit = async (comment: Comment) => {
    const body = editDraft.trim();
    if (!body || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      const updated = await api.comments.update(comment.id, { body });
      setComments((existing) => existing.map((item) => (item.id === comment.id ? { ...item, ...updated } : item)));
      setMode({ kind: 'list' });
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const removeComment = async (comment: Comment) => {
    if (!answer || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      await api.comments.remove(comment.id);
      setComments((existing) => existing.filter((item) => item.id !== comment.id));
      onCountChange(answer.id, -1);
      setMode({ kind: 'list' });
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const menuRow = (label: string, icon: IconName, onPress: () => void, tone: string, first = false) => (
    <Pressable
      key={label}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { borderTopColor: colors.line, borderTopWidth: first ? 0 : StyleSheet.hairlineWidth, backgroundColor: pressed ? colors.subtle : 'transparent' }]}
    >
      <View style={{ width: 22, alignItems: 'center' }}>
        <Icon name={icon} size={15} color={tone} />
      </View>
      <Text size={15} weight="medium" color={tone} style={{ flex: 1 }}>
        {label}
      </Text>
    </Pressable>
  );

  const titles: Partial<Record<Mode['kind'], string>> = { list: 'Comments', edit: 'Edit comment', delete: 'Delete this comment?', official: 'Official Academia Atlas account' };

  return (
    <Sheet visible={Boolean(answer)} onClose={() => (mode.kind === 'list' ? onClose() : backToList())} title={titles[mode.kind]} label={mode.kind === 'menu' ? 'This comment' : undefined}>
      {mode.kind === 'menu' ? (
        <View>
          {mine(mode.comment) ? (
            <>
              {menuRow('Edit', 'edit', () => { setEditDraft(mode.comment.body); setActionError(null); setMode({ kind: 'edit', comment: mode.comment }); }, colors.ink, true)}
              {menuRow('Delete', 'trash', () => { setActionError(null); setMode({ kind: 'delete', comment: mode.comment }); }, colors.danger)}
            </>
          ) : (
            <>
              {menuRow('Report', 'flag', () => setMode({ kind: 'report', comment: mode.comment, escalate: false }), colors.ink, true)}
              {staff ? menuRow('Escalate to admin', 'shield', () => setMode({ kind: 'report', comment: mode.comment, escalate: true }), colors.accent) : null}
            </>
          )}
        </View>
      ) : mode.kind === 'edit' ? (
        <View>
          <FormError message={actionError} />
          <TextInput
            value={editDraft}
            onChangeText={setEditDraft}
            multiline
            autoFocus
            accessibilityLabel="Edit comment"
            placeholderTextColor={colors.muted}
            style={[styles.editInput, webInputReset, { borderColor: colors.strong, color: colors.ink, backgroundColor: colors.surface }]}
          />
          <View style={styles.buttons}>
            <Button title="Cancel" variant="secondary" onPress={backToList} style={{ flex: 1 }} />
            <Button title="Save" onPress={() => saveEdit(mode.comment)} loading={busy} disabled={!editDraft.trim()} style={{ flex: 1 }} />
          </View>
        </View>
      ) : mode.kind === 'delete' ? (
        <View>
          <FormError message={actionError} />
          <Text size={14} color={colors.muted} style={{ marginBottom: 18 }}>
            This can&apos;t be undone.
          </Text>
          <View style={styles.buttons}>
            <Button title="Cancel" variant="secondary" onPress={backToList} style={{ flex: 1 }} />
            <Button title="Delete" variant="danger" onPress={() => removeComment(mode.comment)} loading={busy} style={{ flex: 1 }} />
          </View>
        </View>
      ) : mode.kind === 'report' ? (
        <ReportForm key={`${mode.comment.id}-${mode.escalate}`} contentType="comment" contentId={mode.comment.id} escalate={mode.escalate} onClose={backToList} />
      ) : mode.kind === 'official' ? (
        <View>
          <OfficialAccountNote />
          <Button title="Close" onPress={backToList} fullWidth style={{ marginTop: 16 }} />
        </View>
      ) : (
        <View>
          {loading ? (
            <Text size={14} color={colors.muted}>
              Loading comments...
            </Text>
          ) : error ? (
            <ErrorState error={error} onRetry={() => answerId && load(answerId, 1)} compact />
          ) : comments.length === 0 ? (
            <Text size={14} color={colors.muted} style={{ marginBottom: 12 }}>
              No comments yet.
            </Text>
          ) : (
            <View style={{ gap: 14, marginBottom: 16 }}>
              {comments.map((comment) => (
                <View key={comment.id} style={styles.comment}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={styles.nameRow}>
                      <Text size={11} color={colors.muted} style={{ flexShrink: 1 }}>
                        {comment.author.full_name}
                        {timeAgo(comment.created_at) ? ` · ${timeAgo(comment.created_at)}` : ''}
                      </Text>
                      <PlatformBadge userId={comment.author.id} onPress={() => setMode({ kind: 'official' })} />
                    </View>
                    <Text size={14} color={colors.ink} style={{ marginTop: 1 }}>
                      {comment.body}
                    </Text>
                  </View>
                  {isAuthenticated ? (
                    <Pressable accessibilityRole="button" accessibilityLabel="Comment actions" onPress={() => setMode({ kind: 'menu', comment })} style={styles.kebab}>
                      <Icon name="ellipsisVertical" size={13} color={colors.muted} />
                    </Pressable>
                  ) : null}
                </View>
              ))}
              {hasMore ? (
                <View>
                  {moreError ? (
                    <Text size={12} color={colors.danger} style={{ marginBottom: 6 }}>
                      {errorMessage(moreError)}
                    </Text>
                  ) : null}
                  <Button title="View more" variant="secondary" onPress={() => answerId && load(answerId, page + 1)} loading={loadingMore} fullWidth />
                </View>
              ) : null}
            </View>
          )}

          {isAuthenticated ? (
            <View>
              <FormError message={postError ? errorMessage(postError) : null} />
              <View style={styles.postRow}>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Add a comment..."
                  placeholderTextColor={colors.muted}
                  accessibilityLabel="Add a comment"
                  style={[styles.postInput, webInputReset, { borderColor: colors.strong, color: colors.ink, backgroundColor: colors.surface }]}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Post comment"
                  disabled={posting || !draft.trim()}
                  onPress={submitComment}
                  style={({ pressed }) => [styles.postButton, { backgroundColor: colors.accentSolid, opacity: pressed || posting || !draft.trim() ? 0.6 : 1 }]}
                >
                  <Text size={12} weight="semibold" color="#FFFFFF">
                    Post
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Text size={14} color={colors.muted}>
              Sign in to comment.
            </Text>
          )}
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, minHeight: 52 },
  comment: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  kebab: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 16 },
  editInput: { borderWidth: 1, borderRadius: 8, minHeight: 90, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, textAlignVertical: 'top' },
  postRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  postInput: { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, minHeight: 44 },
  postButton: { borderRadius: 8, paddingHorizontal: 16, paddingVertical: 11, minHeight: 44, justifyContent: 'center' },
});