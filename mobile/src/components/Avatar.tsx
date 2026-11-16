import React, { useEffect, useState } from 'react';
import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { Text } from './Text';
import { fonts, useTheme } from '../theme';

interface Props {
  name: string | null | undefined;
  uri?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
  /** Adds a light border, used for the drawer / profile header. */
  bordered?: boolean;
}

export function Avatar({ name, uri, size = 40, style, bordered }: Props) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  const initial = (name?.trim()?.[0] ?? '?').toUpperCase();
  const fontSize = Math.max(11, Math.round(size * 0.4));

  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.accentSoft,
          borderWidth: bordered ? 1 : 0,
          borderColor: colors.line,
        },
        style,
      ]}
    >
      {uri && !failed ? (
        <Image
          source={{ uri }}
          onError={() => setFailed(true)}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Text
          color={colors.accent}
          style={{ fontFamily: fonts.bold, fontSize, lineHeight: fontSize + 3 }}
        >
          {initial}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
});
