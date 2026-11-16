import { API_BASE_URL } from './config';

export type QueryValue = string | number | boolean | null | undefined;

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
  /** Set for /auth/* endpoints so an expired token never triggers a refresh loop. */
  noAuthRefresh?: boolean;
  /** Skip Authorization entirely (login and refresh must not carry a stale JWT). */
  sendAuth?: boolean;
  timeoutMs?: number;
};

export const FRIENDLY_MESSAGES = {
  network: "Can't reach the server. Check your connection and try again.",
  rateLimited: "You're going a bit fast, wait a moment.",
  unavailable: 'The server is taking too long to respond. Please try again in a moment.',
  serverError: 'Something went wrong on our side. Please try again.',
  sessionExpired: 'Your session expired. Sign in to pick up where you left off.',
  sessionUnavailable:
    "Couldn't verify your session right now. Check your connection and try again.",
} as const;

export class ApiError extends Error {
  readonly status: number;
  readonly fields: Record<string, unknown> | null;
  readonly network: boolean;

  constructor(
    message: string,
    status: number,
    fields: Record<string, unknown> | null = null,
    network = false,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fields = fields;
    this.network = network;
  }

  get isNetwork(): boolean {
    return this.network || this.status === 0;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

export type RefreshResult =
  | { status: 'ok'; access: string }
  | { status: 'invalid' }
  | { status: 'transient' };

/* -------------------------------------------------------------------------- */
/* Session wiring (owned by AuthProvider)                                      */
/* -------------------------------------------------------------------------- */

let accessToken: string | null = null;
let refreshHandler: (() => Promise<RefreshResult>) | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setRefreshHandler(handler: (() => Promise<RefreshResult>) | null): void {
  refreshHandler = handler;
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

let refreshInFlight: Promise<RefreshResult> | null = null;

function refreshAccessToken(): Promise<RefreshResult> {
  if (!refreshHandler) return Promise.resolve({ status: 'invalid' });
  if (!refreshInFlight) {
    refreshInFlight = refreshHandler()
      .catch((): RefreshResult => ({ status: 'transient' }))
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

/* -------------------------------------------------------------------------- */
/* Request handling                                                            */
/* -------------------------------------------------------------------------- */

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const base = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return base;
  const params = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  return params.length > 0 ? `${base}?${params.join('&')}` : base;
}

function abortError(): Error {
  const error = new Error('Aborted');
  error.name = 'AbortError';
  return error;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

async function performFetch(
  url: string,
  options: RequestOptions,
  token: string | null,
): Promise<Response> {
  const { method = 'GET', body, signal, timeoutMs = 20_000 } = options;
  const controller = new AbortController();
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const forwardAbort = () => controller.abort();
  signal?.addEventListener('abort', forwardAbort);

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  try {
    return await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (signal?.aborted) throw abortError();
    if (timedOut) throw new ApiError(FRIENDLY_MESSAGES.unavailable, 0, null, true);
    if (isAbortError(error)) throw abortError();
    throw new ApiError(FRIENDLY_MESSAGES.network, 0, null, true);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', forwardAbort);
  }
}

function firstFieldMessage(fields: Record<string, unknown>): string | null {
  for (const [key, value] of Object.entries(fields)) {
    if (key === 'non_field_errors' || key === 'detail' || key === 'error') {
      if (typeof value === 'string') return value;
      if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
    }
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return null;
}

function messageFrom(data: unknown, status: number): string {
  if (status === 429) return FRIENDLY_MESSAGES.rateLimited;
  if (status === 502 || status === 503 || status === 504) {
    return FRIENDLY_MESSAGES.unavailable;
  }

  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (typeof record.error === 'string' && record.error) return record.error;
    const fieldMessage = firstFieldMessage(record);
    if (fieldMessage) return fieldMessage;
  }

  if (status >= 500) return FRIENDLY_MESSAGES.serverError;
  return `Request failed (${status})`;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    throw new ApiError(
      messageFrom(data, response.status),
      response.status,
      data && typeof data === 'object' ? (data as Record<string, unknown>) : null,
    );
  }

  return data as T;
}

/**
 * Single entry point for every backend call.
 *
 * A 401 refreshes once and retries the original request once. The session is
 * cleared only when the refresh endpoint definitively rejects the token
 * (400/401). A network error, 429 or 5xx during refresh leaves the tokens alone.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const url = buildUrl(path, options.query);

  let response: Response;
  try {
    response = await performFetch(
      url,
      options,
      options.sendAuth === false ? null : accessToken,
    );
  } catch (error) {
    if (isAbortError(error) || error instanceof ApiError) throw error;
    throw new ApiError(FRIENDLY_MESSAGES.network, 0, null, true);
  }

  if (response.status === 401 && !options.noAuthRefresh) {
    const result = await refreshAccessToken();

    if (result.status === 'ok') {
      try {
        response = await performFetch(url, options, result.access);
      } catch (error) {
        if (isAbortError(error) || error instanceof ApiError) throw error;
        throw new ApiError(FRIENDLY_MESSAGES.network, 0, null, true);
      }
    }

    if (response.status === 401) {
      if (result.status === 'invalid') {
        unauthorizedHandler?.();
        throw new ApiError(FRIENDLY_MESSAGES.sessionExpired, 401);
      }
      if (result.status === 'transient') {
        throw new ApiError(FRIENDLY_MESSAGES.sessionUnavailable, 401, null, true);
      }
    }
  }

  return parseResponse<T>(response);
}

export function errorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/** First message for a specific field from a 400 body. */
export function fieldError(error: unknown, field: string): string | null {
  if (!(error instanceof ApiError) || !error.fields) return null;
  const value = error.fields[field];
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  if (typeof value === 'string') return value;
  return null;
}

export { isAbortError };
