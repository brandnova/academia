import { DependencyList, useCallback, useEffect, useRef, useState } from 'react';

import { isAbortError } from '../api/client';

export interface QueryResult<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  refreshing: boolean;
  refetch: () => void;
  setData: (updater: T | null | ((current: T | null) => T | null)) => void;
}

/**
 * Tiny fetch-on-mount hook with abort handling.
 *
 * `deps` behaves like an effect dependency list; pass the things the request
 * depends on (ids, filters). The fetcher may be an inline closure.
 */
export function useQuery<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: DependencyList,
  options: { enabled?: boolean } = {},
): QueryResult<T> {
  const enabled = options.enabled ?? true;
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [refreshing, setRefreshing] = useState(false);
  const [version, setVersion] = useState(0);
  const hasDataRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let active = true;

    if (hasDataRef.current) setRefreshing(true);
    else setLoading(true);
    setError(null);

    fetcherRef
      .current(controller.signal)
      .then((result) => {
        if (!active) return;
        hasDataRef.current = true;
        setData(result);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active || isAbortError(err)) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
        setRefreshing(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, version, ...deps]);

  const refetch = useCallback(() => setVersion((value) => value + 1), []);

  const updateData = useCallback(
    (updater: T | null | ((current: T | null) => T | null)) => {
      setData((current) =>
        typeof updater === 'function'
          ? (updater as (value: T | null) => T | null)(current)
          : updater,
      );
    },
    [],
  );

  return { data, error, loading, refreshing, refetch, setData: updateData };
}
