import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, BackHandler, PanResponder, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../auth/AuthProvider';
import { Avatar } from '../components/Avatar';
import { Icon, IconName } from '../components/Icon';
import { Text } from '../components/Text';
import { useAuthGate } from '../features/auth/AuthGateProvider';
import { StaffDrawerSection } from '../features/staff/StaffDrawerSection';
import { useCapabilities } from '../features/staff/useCapabilities';
import { useTheme } from '../theme';
import { navigateRoot, navigationRef } from './types';

const WIDTH = 290;

type DrawerRoute = 'Tags' | 'Search' | 'MyReports' | 'Pages';

const NAV_ITEMS: { label: string; icon: IconName; route: DrawerRoute; auth?: boolean }[] = [
  { label: 'Browse tags', icon: 'tag', route: 'Tags' },
  { label: 'Search', icon: 'search', route: 'Search' },
  { label: 'My reports', icon: 'flag', route: 'MyReports', auth: true },
  { label: 'Policies and guides', icon: 'fileLines', route: 'Pages' },
];

/** Slide-over menu. Closes on backdrop tap, hardware Back, or a swipe to the left. */
export function Drawer({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, mode, toggleMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { user, isAuthenticated, signOut } = useAuth();
  const { roleLabel, isStaff } = useCapabilities();
  const { promptSignIn } = useAuthGate();
  const progress = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  const panelWidth = Math.min(WIDTH, Math.round(screenWidth * 0.82));
  const widthRef = useRef(panelWidth);
  widthRef.current = panelWidth;
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  const snapBack = () => Animated.timing(progress, { toValue: 1, duration: 150, useNativeDriver: true }).start();

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => g.dx < -8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderMove: (_, g) => progress.setValue(Math.max(0, Math.min(1, 1 + g.dx / widthRef.current))),
        onPanResponderRelease: (_, g) => (g.dx < -widthRef.current * 0.3 || g.vx < -0.6 ? closeRef.current() : snapBack()),
        onPanResponderTerminate: snapBack,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [progress],
  );

  useEffect(() => {
    if (!visible) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [visible, onClose]);

  useEffect(() => {
    if (visible) setMounted(true);
    Animated.timing(progress, { toValue: visible ? 1 : 0, duration: visible ? 220 : 180, useNativeDriver: true }).start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
  }, [visible, progress]);

  if (!mounted) return null;

  const go = (route: DrawerRoute) => {
    onClose();
    setTimeout(() => navigateRoot(route), 180);
  };

  const signIn = () => {
    onClose();
    setTimeout(() => promptSignIn(), 180);
  };

  const logOut = async () => {
    onClose();
    await signOut();
    setTimeout(() => navigationRef.reset({ index: 0, routes: [{ name: 'Login' }] }), 160);
  };

  const row = (pressedBg: string) => ({ pressed }: { pressed: boolean }) => [styles.navItem, { backgroundColor: pressed ? pressedBg : 'transparent' }];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View pointerEvents={visible ? 'auto' : 'none'} style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay, opacity: progress }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close menu" onPress={onClose} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <Animated.View
        {...pan.panHandlers}
        accessibilityViewIsModal
        accessibilityLabel="Main menu"
        style={[
          styles.panel,
          {
            width: panelWidth,
            backgroundColor: colors.surface,
            borderRightColor: colors.line,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-panelWidth, 0] }) }],
          },
        ]}
      >
        <View style={[styles.header, { borderBottomColor: colors.line }]}>
          {isAuthenticated && user ? (
            <>
              <Avatar name={user.full_name} uri={user.avatar} size={44} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text size={14} weight="bold" numberOfLines={1}>
                  {user.full_name}
                </Text>
                <Text size={11} color={colors.muted}>
                  {roleLabel}
                </Text>
              </View>
            </>
          ) : (
            <View style={{ flex: 1 }}>
              <Text size={14} weight="bold" style={{ marginBottom: 12 }}>
                Browsing as a guest
              </Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Sign in with Google" onPress={signIn} style={({ pressed }) => [styles.signIn, { backgroundColor: colors.accentSolid, opacity: pressed ? 0.85 : 1 }]}>
                <Text size={14} weight="semibold" color="#FFFFFF" center>
                  Sign in with Google
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.nav} showsVerticalScrollIndicator={false}>
          {NAV_ITEMS.filter((item) => !item.auth || isAuthenticated).map((item) => (
            <Pressable key={item.label} accessibilityRole="button" accessibilityLabel={item.label} onPress={() => go(item.route)} style={row(colors.subtle)}>
              <Icon name={item.icon} size={16} color={colors.muted} />
              <Text size={14} color={colors.ink} style={{ flex: 1 }}>
                {item.label}
              </Text>
            </Pressable>
          ))}

          {isStaff ? <StaffDrawerSection beforeOpen={onClose} /> : null}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.line }]}>
          <Pressable accessibilityRole="switch" accessibilityLabel={mode === 'dark' ? 'Light mode' : 'Dark mode'} accessibilityState={{ checked: mode === 'dark' }} onPress={toggleMode} style={row(colors.subtle)}>
            <Icon name={mode === 'dark' ? 'sun' : 'moon'} size={16} color={colors.muted} />
            <Text size={14} color={colors.ink} style={{ flex: 1 }}>
              {mode === 'dark' ? 'Light mode' : 'Dark mode'}
            </Text>
          </Pressable>

          {isAuthenticated ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Log out" onPress={logOut} style={row(colors.dangerSoft)}>
              <Icon name="logout" size={16} color={colors.danger} />
              <Text size={14} color={colors.danger} style={{ flex: 1 }}>
                Log out
              </Text>
            </Pressable>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { position: 'absolute', top: 0, bottom: 0, left: 0, borderRightWidth: StyleSheet.hairlineWidth, elevation: 24 },
  header: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 12 },
  signIn: { borderRadius: 8, paddingVertical: 11, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  nav: { paddingHorizontal: 12, paddingVertical: 12, gap: 2 },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 8, minHeight: 44 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 10, gap: 2 },
});