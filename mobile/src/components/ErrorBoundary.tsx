import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from './Button';
import { Icon } from './Icon';
import { Text } from './Text';
import { useTheme } from '../theme';

function Fallback({ onRetry }: { onRetry: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: colors.bg }]}>
      <Icon name="warning" size={30} color={colors.danger} />
      <Text variant="h2" center style={{ marginTop: 14 }}>
        Something went wrong
      </Text>
      <Text size={14} color={colors.muted} center style={{ marginTop: 6, maxWidth: 300 }}>
        The app hit an unexpected problem. Your account and data are safe. Try again, and if it keeps happening, restart the app.
      </Text>
      <Button title="Try again" onPress={onRetry} style={{ marginTop: 20, alignSelf: 'center' }} />
    </View>
  );
}

/** Last line of defence for render errors. Crash reporting plugs into componentDidCatch. */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    if (__DEV__) console.warn('[ErrorBoundary]', error);
  }

  render() {
    return this.state.failed ? <Fallback onRetry={() => this.setState({ failed: false })} /> : this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
});