import { apiRequest, QueryValue } from './client';
import type {
  Answer,
  AuthSession,
  Comment,
  Department,
  Hub,
  HubActivationRequest,
  ListEnvelope,
  MyComment,
  NotificationFilters,
  NotificationPage,
  Page,
  Paginated,
  Question,
  QuestionFilters,
  QuestionStatus,
  Report,
  ReportContentType,
  ReportFilters,
  ReportType,
  School,
  SchoolFilters,
  SearchQuestion,
  Tag,
  TagFilters,
  User,
  UUID,
  VoteType,
} from './types';

const toQuery = (params?: object) => (params ?? {}) as unknown as Record<string, QueryValue>;
const get = <T>(path: string, query?: object, signal?: AbortSignal) => apiRequest<T>(path, { query: toQuery(query), signal });
const post = <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'POST', body });
const patch = <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PATCH', body });
const del = <T = void>(path: string) => apiRequest<T>(path, { method: 'DELETE' });

export interface CreateQuestionInput {
  title: string;
  body: string;
  hub_id: UUID;
  department_id?: UUID | null;
  tags?: string[];
}

export interface UpdateQuestionInput {
  title?: string;
  body?: string;
  department_id?: UUID | null;
  tags?: string[];
}

type Page1 = { page?: number; page_size?: number };

/** The user client only. Moderation and admin calls live on the web, never here. */
export const api = {
  auth: {
    google: (googleAccessToken: string) => apiRequest<AuthSession>('/auth/google/', { method: 'POST', body: { access_token: googleAccessToken }, noAuthRefresh: true, sendAuth: false }),
    refresh: (refresh: string) => apiRequest<{ access: string; refresh: string }>('/auth/refresh/', { method: 'POST', body: { refresh }, noAuthRefresh: true, sendAuth: false }),
    logout: (refresh: string) => apiRequest<void>('/auth/logout/', { method: 'POST', body: { refresh }, noAuthRefresh: true, sendAuth: false }),
  },

  me: {
    get: (signal?: AbortSignal) => get<User>('/users/me/', undefined, signal),
    update: (input: { full_name: string }) => patch<User>('/users/me/', input),
    answers: (query?: Page1, signal?: AbortSignal) => get<Paginated<Answer>>('/users/me/answers/', query, signal),
    comments: (query?: Page1, signal?: AbortSignal) => get<Paginated<MyComment>>('/users/me/comments/', query, signal),
  },

  schools: {
    list: (filters?: SchoolFilters, signal?: AbortSignal) => get<Paginated<School>>('/schools/', filters, signal),
    get: (schoolId: UUID, signal?: AbortSignal) => get<School>(`/schools/${schoolId}/`, undefined, signal),
    bySlug: (slug: string, signal?: AbortSignal) => get<School>(`/schools/by-slug/${encodeURIComponent(slug)}/`, undefined, signal),
    departments: (schoolId: UUID, signal?: AbortSignal) => get<ListEnvelope<Department>>(`/schools/${schoolId}/departments/`, undefined, signal),
  },

  hubs: {
    get: (hubId: UUID, signal?: AbortSignal) => get<Hub>(`/hubs/${hubId}/`, undefined, signal),
    bySchool: (schoolId: UUID, signal?: AbortSignal) => get<Hub>(`/hubs/by-school/${schoolId}/`, undefined, signal),
    bySlug: (slug: string, signal?: AbortSignal) => get<Hub>(`/hubs/by-slug/${encodeURIComponent(slug)}/`, undefined, signal),
    activationRequests: {
      create: (input: { school_id: UUID; notes?: string }) => post<HubActivationRequest>('/hubs/activation-requests/', input),
    },
  },

  questions: {
    list: (filters?: QuestionFilters, signal?: AbortSignal) => get<Paginated<Question>>('/questions/', filters, signal),
    get: (questionId: UUID, signal?: AbortSignal) => get<Question>(`/questions/${questionId}/`, undefined, signal),
    create: (input: CreateQuestionInput) => post<Question>('/questions/', input),
    update: (questionId: UUID, input: UpdateQuestionInput) => patch<Question>(`/questions/${questionId}/`, input),
    remove: (questionId: UUID) => del(`/questions/${questionId}/`),
    follow: (questionId: UUID) => post<{ message: string; is_following: boolean }>(`/questions/${questionId}/follow/`),
    unfollow: (questionId: UUID) => del(`/questions/${questionId}/follow/`),
    lock: (questionId: UUID) => post<{ message: string; is_locked: boolean }>(`/questions/${questionId}/lock/`),
    unlock: (questionId: UUID) => del<{ message: string; is_locked: boolean }>(`/questions/${questionId}/lock/`),
  },

  answers: {
    create: (input: { question_id: UUID; body: string }) => post<Answer>('/answers/', input),
    update: (answerId: UUID, input: { body: string }) => patch<Answer>(`/answers/${answerId}/`, input),
    remove: (answerId: UUID) => del(`/answers/${answerId}/`),
    markBest: (answerId: UUID) => post<{ message: string; answer: { id: UUID; is_best: boolean }; question: { id: UUID; status: QuestionStatus } }>(`/answers/${answerId}/mark-best/`),
    vote: (answerId: UUID, voteType: VoteType) => post<{ message: string; vote_type: VoteType; vote_score: number }>(`/answers/${answerId}/vote/`, { vote_type: voteType }),
    removeVote: (answerId: UUID) => del(`/answers/${answerId}/vote/`),
  },

  comments: {
    list: (answerId: UUID, query?: Page1, signal?: AbortSignal) => get<Paginated<Comment>>(`/answers/${answerId}/comments/`, query, signal),
    create: (input: { answer_id: UUID; body: string }) => post<Comment>('/comments/', input),
    update: (commentId: UUID, input: { body: string }) => patch<Comment>(`/comments/${commentId}/`, input),
    remove: (commentId: UUID) => del(`/comments/${commentId}/`),
  },

  tags: {
    list: (filters?: TagFilters, signal?: AbortSignal) => get<Paginated<Tag>>('/tags/', filters, signal),
    questions: (tagName: string, filters?: QuestionFilters, signal?: AbortSignal) => get<Paginated<Question>>(`/tags/${encodeURIComponent(tagName)}/questions/`, filters, signal),
  },

  search: {
    questions: (query: { q?: string; hub?: UUID; school?: UUID; department?: UUID; tag?: string; page?: number; page_size?: number }, signal?: AbortSignal) => get<Paginated<SearchQuestion>>('/search/questions/', query, signal),
  },

  notifications: {
    list: (filters?: NotificationFilters, signal?: AbortSignal) => get<NotificationPage>('/notifications/', filters, signal),
    markRead: (notificationId: UUID) => post<{ message: string; is_read: boolean }>(`/notifications/${notificationId}/mark-read/`),
    markAllRead: () => post<{ message: string; count: number }>('/notifications/mark-all-read/'),
  },

  reports: {
    create: (input: { content_type: ReportContentType; content_id: UUID; type: ReportType; description?: string }) => post<Report>('/reports/', input),
    mine: (filters?: ReportFilters, signal?: AbortSignal) => get<Paginated<Report>>('/reports/mine/', filters, signal),
    escalate: (reportId: UUID) => post<Report>(`/reports/${reportId}/escalate/`),
  },

  pages: {
    list: (signal?: AbortSignal) => get<ListEnvelope<Page>>('/pages/', undefined, signal),
    get: (slug: string, signal?: AbortSignal) => get<Page>(`/pages/${encodeURIComponent(slug)}/`, undefined, signal),
  },
};