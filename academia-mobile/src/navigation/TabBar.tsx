import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUnread } from '../auth/UnreadProvider';
import { Icon, IconName } from '../components/Icon';
import { Text } from '../components/Text';
import { useAuthGate } from '../features/auth/AuthGateProvider';
import { fabShadow, useTheme } from '../theme';

const TAB_META: Record<string, { label: string; icon: IconName }> = {
  Home: { label: 'Home', icon: 'home' },
  Schools: { label: 'Schools', icon: 'building' },
  Alerts: { label: 'Alerts', icon: 'bell' },
  Profile: { label: 'Profile', icon: 'user' },
};

/** Five slots like the mockup: four tabs and a raised Ask action in the centre. */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { unreadCount } = useUnread();
  const { requireAuth } = useAuthGate();

  const go = (index: number) => {
    const route = state.routes[index];
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (state.index !== index && !event.defaultPrevented) navigation.navigate(route.name as never);
  };

  const renderTab = (routeName: string, index: number) => {
    const meta = TAB_META[routeName];
    if (!meta) return null;
    const focused = state.index === index;
    const unread = routeName === 'Alerts' ? unreadCount : 0;

    return (
      <Pressable
        key={routeName}
        accessibilityRole="tab"
        accessibilityLabel={unread > 0 ? `${meta.label}, ${unread} unread` : meta.label}
        accessibilityState={{ selected: focused }}
        onPress={() => go(index)}
        style={({ pressed }) => [styles.tab, { opacity: pressed ? 0.65 : 1 }]}
      >
        <View>
          <Icon name={meta.icon} family={meta.icon === 'bell' ? 'regular' : 'solid'} size={17} color={focused ? colors.accent : colors.muted} />
          {unread > 0 ? (
            <View style={[styles.badge, { backgroundColor: colors.accentSolid }]}>
              <Text size={10} weight="semibold" color="#FFFFFF">
                {unread > 99 ? '99+' : unread}
              </Text>
            </View>
          ) : null}
        </View>
        <Text size={10} weight="medium" color={focused ? colors.accent : colors.muted}>
          {meta.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.bar, { backgroundColor: colors.surface, borderTopColor: colors.line, paddingBottom: Math.max(insets.bottom, 10) }]}>
      {renderTab('Home', 0)}
      {renderTab('Schools', 1)}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ask a question"
        onPress={() => requireAuth(() => navigation.navigate('Ask', { nonce: Date.now() }), 'Sign in to ask a question.')}
        style={({ pressed }) => [styles.askWrap, { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] }]}
      >
        <View style={[styles.askButton, { backgroundColor: colors.accentSolid }, fabShadow]}>
          <Icon name="plus" size={18} color="#FFFFFF" />
        </View>
      </Pressable>

      {renderTab('Alerts', 3)}
      {renderTab('Profile', 4)}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-around', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8, paddingHorizontal: 8 },
  tab: { alignItems: 'center', gap: 4, width: 56, paddingTop: 2, minHeight: 48 },
  badge: { position: 'absolute', top: -6, right: -10, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  askWrap: { width: 56, alignItems: 'center', marginTop: -20 },
  askButton: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});