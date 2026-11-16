/**
 * Types mirroring api-contract.md (v1). Only fields the app reads are modeled,
 * but response shapes follow the contract exactly.
 */

export type UUID = string;

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ListEnvelope<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
}

export type QuestionStatus = 'OPEN' | 'ANSWERED' | 'SOLVED';
export type VoteType = 'UP' | 'DOWN';
export type InstitutionType = 'UNIVERSITY' | 'POLYTECHNIC' | 'COLLEGE_OF_EDUCATION';
export type Ownership = 'FEDERAL' | 'STATE' | 'PRIVATE';
export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED';
export type ReportStatus = 'PENDING' | 'RESOLVED' | 'REJECTED';
export type ReportContentType = 'question' | 'answer' | 'comment';
export type ReportType = 'SPAM' | 'ABUSE' | 'MISINFORMATION' | 'DUPLICATE';
export type ActivationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface UserSummary {
  id: UUID;
  full_name: string;
  avatar: string | null;
  email?: string;
}

export interface SchoolSummary {
  id: UUID;
  name: string;
  short_name: string;
  slug: string;
  location?: string;
}

export interface SchoolRef {
  id: UUID;
  name: string;
  short_name: string;
  slug: string;
}

export interface HubRef {
  id: UUID;
  school: SchoolRef;
}

export interface RoleSchool {
  id: UUID;
  name: string;
  slug: string;
  short_name?: string;
}

/** users/me sends a lighter school shape for role assignments than for hubs. */
export interface RoleAssignment {
  hub_id: UUID;
  school: RoleSchool;
}

export interface UserStats {
  question_count: number;
  answer_count: number;
  best_answer_count: number;
  comment_count: number;
}

export interface User {
  id: UUID;
  email: string;
  full_name: string;
  avatar: string | null;
  is_admin: boolean;
  moderator_for: RoleAssignment[];
  representative_for: RoleAssignment[];
  stats: UserStats;
  created_at: string;
}

export interface AuthSession {
  access: string;
  refresh: string;
  user: User;
}

export interface School {
  id: UUID;
  name: string;
  short_name: string;
  slug: string;
  location: string | null;
  website: string | null;
  has_hub: boolean;
  is_active: boolean;
  verification_status?: VerificationStatus;
  institution_type: InstitutionType | null;
  ownership: Ownership | null;
  state: string | null;
  country: string | null;
  regulatory_code?: string | null;
  source_url?: string | null;
  last_verified_at?: string | null;
  departments?: Department[];
  created_at: string;
}

export interface Department {
  id: UUID;
  name: string;
  code: string | null;
  question_count: number;
  is_active: boolean;
}

export interface Hub {
  id: UUID;
  school: SchoolSummary & { location?: string | null };
  is_active: boolean;
  activated_at: string | null;
  departments: Department[];
  question_count: number;
  moderator_count: number;
}

export interface QuestionTag {
  name: string;
}

export interface Question {
  id: UUID;
  title: string;
  slug: string;
  body: string;
  status: QuestionStatus;
  view_count: number;
  is_locked: boolean;
  is_following?: boolean;
  author: UserSummary;
  hub: { id: UUID; school: SchoolRef };
  department: { id: UUID; name: string } | null;
  tags: string[];
  answers?: Answer[];
  answer_count: number;
  best_answer_id: UUID | null;
  created_at: string;
  updated_at: string;
}

export interface SearchQuestion {
  id: UUID;
  title: string;
  slug: string;
  body: string;
  status: QuestionStatus;
  score: number | null;
  author: UserSummary;
  hub: { id: UUID; school: SchoolRef };
  department?: { id: UUID; name: string } | null;
  tags: string[];
  created_at: string;
}

export interface Answer {
  id: UUID;
  body: string;
  question?: { id: UUID; title: string };
  author: UserSummary;
  is_best: boolean;
  vote_score: number;
  user_vote: VoteType | null;
  comment_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: UUID;
  body: string;
  author: UserSummary;
  answer: { id: UUID; question?: { id: UUID; title: string } };
  created_at: string;
  updated_at: string;
}

export interface MyComment extends Omit<Comment, 'author' | 'answer'> {
  answer: { id: UUID; question?: { id: UUID; title: string } };
}

export interface Tag {
  id: UUID;
  name: string;
  question_count: number;
}

export interface LinkTarget {
  question_id: UUID;
  question_slug: string | null;
  answer_id: UUID | null;
}

export type NotificationType =
  | 'NEW_ANSWER'
  | 'BEST_ANSWER'
  | 'HUB_ACTIVATED'
  | 'HUB_ACTIVATION_REJECTED'
  | 'NEW_COMMENT'
  | 'VOTE'
  | 'MODERATOR_ASSIGNED'
  | 'NEW_QUESTION'
  | 'NEW_ACTIVATION_REQUEST'
  | 'NEW_REPORT'
  | 'USER_SUSPENDED'
  | 'REPORT_REVIEWED';

export interface AppNotification {
  id: UUID;
  type: NotificationType | string;
  message: string;
  is_read: boolean;
  related_object_id: UUID | null;
  related_object_type: string | null;
  link_target: LinkTarget | null;
  created_at: string;
}

export interface NotificationPage extends Paginated<AppNotification> {
  unread_count: number;
}

export interface Report {
  id: UUID;
  content_type: ReportContentType;
  content_id: UUID;
  type: ReportType;
  description: string | null;
  status: ReportStatus;
  reporter?: UserSummary | null;
  is_escalated?: boolean;
  escalated_by?: UserSummary | null;
  content_exists?: boolean;
  link_target?: LinkTarget | null;
  resolved_at?: string | null;
  created_at: string;
}

export interface HubActivationRequest {
  id: UUID;
  school: SchoolSummary;
  user: UserSummary;
  status: ActivationStatus;
  notes: string | null;
  rejection_reason?: string | null;
  created_at: string;
}

export interface StaffAssignment {
  id: UUID;
  user: UserSummary;
  hub: { id: UUID };
  is_active: boolean;
  created_at: string;
}

export interface AdminUser {
  id: UUID;
  email: string;
  full_name: string;
  avatar: string | null;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Page {
  id: UUID;
  title: string;
  slug: string;
  body?: string;
  visibility: 'PUBLIC' | 'STAFF';
  is_published: boolean;
  created_by: { id: UUID; full_name: string } | null;
  created_at?: string;
  updated_at: string;
}

export interface QuestionFilters {
  hub?: UUID;
  department?: UUID;
  status?: QuestionStatus;
  tag?: string;
  author?: UUID;
  search?: string;
  ordering?: 'created_at' | '-created_at' | 'views' | '-views';
  page?: number;
  page_size?: number;
}

export interface SchoolFilters {
  search?: string;
  has_hub?: boolean;
  institution_type?: InstitutionType;
  ownership?: Ownership;
  state?: string;
  is_active?: boolean;
  page?: number;
  page_size?: number;
}

export interface TagFilters {
  search?: string;
  popular?: boolean;
  page?: number;
  page_size?: number;
}

export interface NotificationFilters {
  is_read?: boolean;
  page?: number;
  page_size?: number;
}

export interface ReportFilters {
  status?: ReportStatus;
  is_escalated?: boolean;
  content_type?: ReportContentType;
  page?: number;
  page_size?: number;
}
