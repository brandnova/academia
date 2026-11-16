import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';

import { fonts, useTheme } from '../theme';

export type TextVariant =
  | 'display'
  | 'hero'
  | 'h1'
  | 'h2'
  | 'title'
  | 'body'
  | 'bodyStrong'
  | 'small'
  | 'caption'
  | 'micro'
  | 'label';

export type TextWeight = keyof typeof fonts;

const VARIANTS: Record<TextVariant, TextStyle> = {
  display: { fontSize: 30, lineHeight: 36, fontFamily: fonts.extrabold, letterSpacing: -0.6 },
  hero: { fontSize: 24, lineHeight: 31, fontFamily: fonts.extrabold, letterSpacing: -0.3 },
  h1: { fontSize: 20, lineHeight: 27, fontFamily: fonts.extrabold, letterSpacing: -0.2 },
  h2: { fontSize: 18, lineHeight: 24, fontFamily: fonts.extrabold },
  title: { fontSize: 16, lineHeight: 22, fontFamily: fonts.bold },
  body: { fontSize: 15, lineHeight: 24, fontFamily: fonts.regular },
  bodyStrong: { fontSize: 14, lineHeight: 20, fontFamily: fonts.semibold },
  small: { fontSize: 13, lineHeight: 20, fontFamily: fonts.regular },
  caption: { fontSize: 12, lineHeight: 18, fontFamily: fonts.regular },
  micro: { fontSize: 11, lineHeight: 16, fontFamily: fonts.regular },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
};

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  weight?: TextWeight;
  size?: number;
  color?: string;
  center?: boolean;
  compact?: boolean;
}

/**
 * Typography wrapper. Every variant maps to a size/weight used in the v2
 * mobile design, so screens pick a role instead of raw sizes.
 */
export function Text({
  variant = 'body',
  weight,
  size,
  color,
  center,
  compact,
  style,
  children,
  ...rest
}: TextProps) {
  const { colors } = useTheme();
  const base = VARIANTS[variant];

  return (
    <RNText
      {...rest}
      style={[
        base,
        compact && { lineHeight: (base.lineHeight ?? 20) - 2 },
        weight && { fontFamily: fonts[weight] },
        size !== undefined && { fontSize: size, lineHeight: Math.round(size * 1.45) },
        { color: color ?? colors.ink },
        center && { textAlign: 'center' },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}
