import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Drawer } from './Drawer';

interface DrawerApi {
  open: () => void;
  close: () => void;
}

const DrawerContext = createContext<DrawerApi | null>(null);

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);

  const api = useMemo<DrawerApi>(
    () => ({
      open: () => setVisible(true),
      close: () => setVisible(false),
    }),
    [],
  );

  const close = useCallback(() => setVisible(false), []);

  return (
    <DrawerContext.Provider value={api}>
      <View style={styles.root}>
        {children}
        <Drawer visible={visible} onClose={close} />
      </View>
    </DrawerContext.Provider>
  );
}

export function useDrawer(): DrawerApi {
  const value = useContext(DrawerContext);
  if (!value) throw new Error('useDrawer must be used inside DrawerProvider');
  return value;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
