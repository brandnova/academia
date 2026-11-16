import { DependencyList, useCallback, useEffect, useRef, useState } from 'react';

import { isAbortError } from '../api/client';
import type { Paginated } from '../api/types';

type PageFetcher<T> = (page: number, signal: AbortSignal) => Promise<Paginated<T>>;

/**
 * Paginated list state with pull-to-refresh and infinite scroll.
 * Re-runs from page 1 whenever `deps` change.
 */
export function usePagedList<T>(
  fetchPage: PageFetcher<T>,
  deps: DependencyList,
  options: { enabled?: boolean } = {},
) {
  const enabled = options.enabled ?? true;
  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;

  const [items, setItems] = useState<T[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(enabled);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<Error | null>(null);
  const [version, setVersion] = useState(0);

  const inFlight = useRef<AbortController | null>(null);
  const requestId = useRef(0);
  const loadingMoreRef = useRef(false);
  const pageRef = useRef(1);
  const itemsRef = useRef<T[]>([]);
  const countRef = useRef(0);

  itemsRef.current = items;
  countRef.current = count;

  const run = useCallback(async (targetPage: number, mode: 'initial' | 'refresh' | 'more') => {
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    const id = ++requestId.current;

    if (mode !== 'more') setLoadMoreError(null);
    if (mode === 'refresh') setRefreshing(true);
    else if (mode === 'more') {
      loadingMoreRef.current = true;
      setLoadingMore(true);
    } else setLoading(true);

    try {
      const response = await fetchRef.current(targetPage, controller.signal);
      if (id !== requestId.current || controller.signal.aborted) return;
      setCount(response.count);
      setPage(targetPage);
      pageRef.current = targetPage;
      setItems((current) =>
        targetPage === 1 ? response.results : mergeUnique(current, response.results),
      );
      setError(null);
      setLoadMoreError(null);
    } catch (err) {
      if (id !== requestId.current || controller.signal.aborted || isAbortError(err)) return;
      const normalized = err instanceof Error ? err : new Error(String(err));
      if (mode === 'more') setLoadMoreError(normalized);
      else setError(normalized);
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setRefreshing(false);
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setItems([]);
    setCount(0);
    setPage(1);
    pageRef.current = 1;
    run(1, 'initial');

    return () => {
      inFlight.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, version, ...deps]);

  const refresh = useCallback(() => {
    void run(1, 'refresh');
  }, [run]);

  const loadMore = useCallback(() => {
    if (loadingMoreRef.current) return;
    if (itemsRef.current.length >= countRef.current) return;
    void run(pageRef.current + 1, 'more');
  }, [run]);

  const retry = useCallback(() => setVersion((value) => value + 1), []);

  const hasMore = items.length < count;

  return {
    items,
    count,
    loading,
    refreshing,
    loadingMore,
    error,
    loadMoreError,
    hasMore,
    page,
    refresh,
    loadMore,
    retry,
    setItems,
    setError,
  };
}


function mergeUnique<T>(current: T[], incoming: T[]): T[] {
  const seen = new Set(
    current.map((item) => (item as { id?: string }).id).filter(Boolean),
  );
  return [
    ...current,
    ...incoming.filter((item) => {
      const id = (item as { id?: string }).id;
      if (!id) return true;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    }),
  ];
}
