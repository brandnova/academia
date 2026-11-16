import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, DimensionValue, Pressable, StyleSheet, View } from 'react-native';

import { Button } from './Button';
import { Icon, IconName } from './Icon';
import { Text } from './Text';
import { ApiError, errorMessage } from '../api/client';
import { useReduceMotion } from '../lib/useReduceMotion';
import { radii, useTheme } from '../theme';

function Pulse({ children }: { children: React.ReactNode }) {
  const reduce = useReduceMotion();
  const opacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(Animated.sequence([Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }), Animated.timing(opacity, { toValue: 0.55, duration: 700, useNativeDriver: true })]));
    loop.start();
    return () => loop.stop();
  }, [opacity, reduce]);

  return <Animated.View style={{ opacity: reduce ? 0.8 : opacity }}>{children}</Animated.View>;
}

export function Loading({ label }: { label?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.center} accessibilityRole="progressbar">
      <ActivityIndicator color={colors.accent} />
      {label ? (
        <Text size={12} color={colors.muted} style={{ marginTop: 10 }}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

export function EmptyState({ icon = 'messageRegular', title, message, actionLabel, onAction, compact }: { icon?: IconName; title: string; message?: string; actionLabel?: string; onAction?: () => void; compact?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.stateCard, { borderColor: colors.strong, paddingVertical: compact ? 28 : 44 }]}>
      <Icon name={icon} size={28} color={colors.strong} />
      <Text size={14} weight="semibold" center style={{ marginTop: 12 }}>
        {title}
      </Text>
      {message ? (
        <Text size={14} color={colors.muted} center style={{ marginTop: 4, maxWidth: 280 }}>
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? <Button title={actionLabel} onPress={onAction} variant="secondary" size="sm" style={{ marginTop: 16, alignSelf: 'center' }} /> : null}
    </View>
  );
}

/** Load failure with Retry. A network failure gets its own icon and title. */
export function ErrorState({ error, onRetry, compact }: { error: unknown; onRetry?: () => void; compact?: boolean }) {
  const { colors } = useTheme();
  const offline = error instanceof ApiError && error.isNetwork;
  return (
    <View accessibilityRole="alert" style={[styles.errorWrap, compact && { paddingVertical: 24 }]}>
      <Icon name={offline ? 'wifi' : 'warning'} size={28} color={offline ? colors.muted : colors.danger} />
      <Text size={14} weight="semibold" center style={{ marginTop: 12 }}>
        {offline ? "Can't connect" : "Couldn't load this"}
      </Text>
      <Text size={14} color={colors.muted} center style={{ marginTop: 4, maxWidth: 300 }}>
        {errorMessage(error, 'The server is taking too long to respond. Please try again in a moment.')}
      </Text>
      {onRetry ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Try again" onPress={onRetry} style={({ pressed }) => [styles.retry, { borderColor: colors.strong, opacity: pressed ? 0.7 : 1 }]}>
          <Text size={14} weight="semibold" color={colors.ink}>
            Try again
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function SkeletonQuestionList({ rows = 5 }: { rows?: number }) {
  const { colors } = useTheme();
  const line = (width: DimensionValue, small = false) => <View style={[styles.skeletonLine, small && styles.skeletonSmall, { backgroundColor: colors.skeleton, width }]} />;
  return (
    <Pulse>
      <View accessibilityLabel="Loading questions">
        {Array.from({ length: rows }).map((_, index) => (
          <View key={index} style={styles.skeletonRow}>
            <View style={[styles.skeletonDot, { backgroundColor: colors.skeleton }]} />
            <View style={{ flex: 1, gap: 8 }}>
              {line(`${72 - (index % 3) * 8}%`)}
              {line(`${48 + (index % 2) * 12}%`, true)}
              {line('32%', true)}
            </View>
          </View>
        ))}
      </View>
    </Pulse>
  );
}

export function SkeletonBlock({ height = 80, width = '100%' }: { height?: number; width?: DimensionValue }) {
  const { colors } = useTheme();
  return (
    <Pulse>
      <View style={{ height, width, borderRadius: radii.md, backgroundColor: colors.skeleton, marginHorizontal: 16 }} />
    </Pulse>
  );
}

export function ListFooter({ loadingMore }: { loadingMore: boolean }) {
  const { colors } = useTheme();
  if (!loadingMore) return <View style={{ height: 12 }} />;
  return (
    <View style={styles.footer}>
      <ActivityIndicator color={colors.accent} size="small" />
    </View>
  );
}

export function ViewMoreButton({ visible, loading, error, onPress }: { visible: boolean; loading?: boolean; error?: Error | null; onPress: () => void }) {
  const { colors } = useTheme();
  if (!visible) return null;

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 16, alignItems: 'center' }}>
      <Pressable accessibilityRole="button" accessibilityLabel="View more" disabled={loading} onPress={onPress} style={({ pressed }) => [styles.viewMore, { borderColor: colors.strong, opacity: pressed || loading ? 0.7 : 1 }]}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.muted} />
        ) : (
          <Text size={14} weight="medium" color={colors.ink}>
            View more
          </Text>
        )}
      </Pressable>
      {error ? (
        <Text accessibilityRole="alert" size={12} color={colors.danger} center style={{ marginTop: 8 }}>
          {errorMessage(error)}
        </Text>
      ) : null}
    </View>
  );
}

export function OfflineBanner() {
  const { colors } = useTheme();
  return (
    <View accessibilityRole="alert" style={[styles.offline, { backgroundColor: colors.warningBg }]}>
      <Icon name="wifi" size={12} color={colors.warningInk} />
      <Text size={12} color={colors.warningInk} style={{ flex: 1 }}>
        You&apos;re offline. Content may be out of date.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  stateCard: { marginHorizontal: 16, marginTop: 24, borderWidth: 1, borderStyle: 'dashed', borderRadius: radii.lg, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  errorWrap: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  retry: { borderWidth: 1, borderRadius: radii.md, paddingHorizontal: 16, paddingVertical: 10, marginTop: 16, minHeight: 44, justifyContent: 'center' },
  footer: { paddingVertical: 20, alignItems: 'center' },
  skeletonRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  skeletonDot: { width: 14, height: 14, borderRadius: 7, marginTop: 4 },
  skeletonLine: { height: 12, borderRadius: 6 },
  skeletonSmall: { height: 9 },
  viewMore: { borderWidth: 1, borderRadius: radii.md, paddingHorizontal: 18, paddingVertical: 10, minHeight: 44, minWidth: 120, alignItems: 'center', justifyContent: 'center' },
  offline: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 6 },
});