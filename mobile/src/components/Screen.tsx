import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';

import { OfflineBanner } from './States';
import { useNetwork } from '../features/network/NetworkProvider';
import { useTheme } from '../theme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: readonly Edge[];
}

export function Screen({ children, style, edges = ['top'] }: Props) {
  const { colors } = useTheme();
  const { isOffline } = useNetwork();

  return (
    <SafeAreaView
      edges={edges}
      style={[{ flex: 1, backgroundColor: colors.bg }, style]}
    >
      {isOffline ? <OfflineBanner /> : null}
      {children}
    </SafeAreaView>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        { height: StyleSheet.hairlineWidth, backgroundColor: colors.line },
        style,
      ]}
    />
  );
}

export function Spacer({ height = 12 }: { height?: number }) {
  return <View style={{ height }} />;
}
