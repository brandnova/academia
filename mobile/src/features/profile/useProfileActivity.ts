import { useCallback } from 'react';

import { api } from '../../api/endpoints';
import type { Answer, MyComment, Question } from '../../api/types';
import { usePagedList } from '../../lib/usePagedList';

/** The three paged lists behind the profile tabs. Each loads page 1 on mount and appends on View more. */
export function useProfileActivity(userId: string | undefined, enabled: boolean) {
  const on = { enabled: enabled && Boolean(userId) };
  const questions = usePagedList<Question>((page, signal) => api.questions.list({ author: userId, page, page_size: 20, ordering: '-created_at' }, signal), [userId], on);
  const answers = usePagedList<Answer>((page, signal) => api.me.answers({ page, page_size: 20 }, signal), [userId], on);
  const comments = usePagedList<MyComment>((page, signal) => api.me.comments({ page, page_size: 20 }, signal), [userId], on);

  const refresh = useCallback(() => {
    questions.refresh();
    answers.refresh();
    comments.refresh();
  }, [questions, answers, comments]);

  return { questions, answers, comments, refresh, refreshing: questions.refreshing || answers.refreshing || comments.refreshing };
}

export type ProfileActivity = ReturnType<typeof useProfileActivity>;