import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

/** Refresh when a screen regains focus, skipping the initial focus. */
export function useRefreshOnFocus(refresh: () => void) {
  const first = useRef(true);
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useFocusEffect(
    useCallback(() => {
      if (first.current) {
        first.current = false;
        return;
      }
      refreshRef.current();
    }, []),
  );
}
