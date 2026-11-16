import React from 'react';
import { KeyboardAvoidingView, Platform, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TOP_BAR_HEIGHT = 52;

/**
 * The one wrapper for screens that have inputs near the bottom. Android uses
 * 'height' (the strategy the sheets already prove works on a real device),
 * iOS uses 'padding' with an offset for the safe area and top bar.
 */
export function KeyboardAvoid({ children, style, offset = 0 }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; offset?: number }) {
  const insets = useSafeAreaInsets();
  const ios = Platform.OS === 'ios';

  return (
    <KeyboardAvoidingView style={[{ flex: 1 }, style]} behavior={ios ? 'padding' : 'height'} keyboardVerticalOffset={ios ? insets.top + TOP_BAR_HEIGHT + offset : offset}>
      {children}
    </KeyboardAvoidingView>
  );
}