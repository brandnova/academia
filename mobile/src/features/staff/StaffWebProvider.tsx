import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Linking, View } from 'react-native';

import { Button } from '../../components/Button';
import { Sheet } from '../../components/Sheet';
import { Text } from '../../components/Text';
import { webUrl } from '../../config/app';
import { useTheme } from '../../theme';

interface StaffWebValue {
  openOnWeb: (path: string, label?: string) => void;
}

const StaffWebContext = createContext<StaffWebValue | null>(null);

/**
 * Confirmation sheet for all staff web handoffs. This is the only place the
 * mobile app opens the web app, and it never passes a token.
 */
export function StaffWebProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const [target, setTarget] = useState<{ path: string; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openOnWeb = useCallback((path: string, label?: string) => {
    setError(null);
    setTarget({
      path,
      label: label ?? (path.includes('admin') ? 'Admin dashboard' : 'Moderation tools'),
    });
  }, []);

  const value = useMemo(() => ({ openOnWeb }), [openOnWeb]);

  const open = async () => {
    if (!target) return;
    const url = webUrl(target.path);
    try {
      await Linking.openURL(url);
      setTarget(null);
    } catch {
      setError('Could not open a browser. Check the URL and try again.');
    }
  };

  return (
    <StaffWebContext.Provider value={value}>
      {children}
      <Sheet
        visible={Boolean(target)}
        onClose={() => setTarget(null)}
        title="Open on the web"
      >
        <Text size={14} color={colors.muted} style={{ marginBottom: 12 }}>
          These tools live on the Academia Atlas website. They open in your browser and
          you will sign in there with the same Google account.
        </Text>
        <Text size={12} color={colors.muted} style={{ marginBottom: 18 }}>
          {target ? webUrl(target.path) : ''}
        </Text>
        {error ? (
          <Text size={12} color={colors.danger} style={{ marginBottom: 12 }}>
            {error}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button
            title="Cancel"
            variant="secondary"
            onPress={() => setTarget(null)}
            style={{ flex: 1 }}
          />
          <Button
            title="Open in browser"
            onPress={open}
            style={{ flex: 1 }}
          />
        </View>
      </Sheet>
    </StaffWebContext.Provider>
  );
}

export function useStaffWeb(): StaffWebValue {
  const value = useContext(StaffWebContext);
  if (!value) throw new Error('useStaffWeb must be used inside StaffWebProvider');
  return value;
}
