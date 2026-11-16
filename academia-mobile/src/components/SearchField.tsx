import React from 'react';
import { Pressable, StyleProp, StyleSheet, TextInput, TextInputProps, View, ViewStyle } from 'react-native';

import { Icon } from './Icon';
import { Text } from './Text';
import { fonts, radii, useTheme, webInputReset } from '../theme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  autoFocus?: boolean;
  editable?: boolean;
  style?: StyleProp<ViewStyle>;
  size?: 'sm' | 'md';
  right?: React.ReactNode;
  returnKeyType?: TextInputProps['returnKeyType'];
  accessibilityLabel?: string;
  maxLength?: number;
}

export function SearchField({ value, onChangeText, placeholder = 'Search...', onSubmit, autoFocus, editable = true, style, size = 'md', right, returnKeyType = 'search', accessibilityLabel, maxLength }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.wrap, { height: size === 'sm' ? 44 : 48, backgroundColor: colors.surface, borderColor: colors.strong, paddingHorizontal: 14 }, style]}>
      <Icon name="search" size={14} color={colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        returnKeyType={returnKeyType}
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={autoFocus}
        editable={editable}
        maxLength={maxLength}
        accessibilityLabel={accessibilityLabel ?? placeholder}
        style={[styles.input, webInputReset, { color: colors.ink, fontSize: 14 }]}
      />
      {value.length > 0 ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={8} onPress={() => onChangeText('')}>
          <Icon name="close" size={14} color={colors.muted} />
        </Pressable>
      ) : null}
      {right}
    </View>
  );
}

/** Non-interactive pill used on the Home screen to jump into Search. */
export function SearchPill({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="search"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.pill, { backgroundColor: colors.surface, borderColor: colors.strong, opacity: pressed ? 0.85 : 1 }]}
    >
      <Icon name="search" size={14} color={colors.muted} />
      <Text size={13} color={colors.muted}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: radii.pill },
  // height 100% makes the TextInput's intrinsic height match the pill on Android.
  input: { flex: 1, paddingVertical: 0, fontFamily: fonts.regular, height: '100%' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: 16, paddingVertical: 12, minHeight: 48 },
});