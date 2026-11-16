import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

import { BRAND } from '../config/brand';
import { useTheme } from '../theme';

const BRAND_MARK_RATIO = 1; // The brand PNGs are square.

/** The logo mark. White A on dark backgrounds, blue A on light ones. Both width and height are explicit, so no layout rule can render it at its pixel size. */
export function BrandMark({ width = 56, style }: { width?: number; style?: StyleProp<ImageStyle> }) {
  const { mode } = useTheme();
  const source = mode === 'dark' ? BRAND.markLight : BRAND.markColor;

  return <Image source={source} resizeMode="contain" accessible={false} accessibilityIgnoresInvertColors style={[{ width, height: width / BRAND_MARK_RATIO }, style]} />;
}