import React, { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { useAuth } from '../auth/AuthProvider';
import { Avatar } from '../components/Avatar';
import { Icon, IconName } from '../components/Icon';
import { Screen } from '../components/Screen';
import { EmptyState } from '../components/States';
import { Text } from '../components/Text';
import { TopBar } from '../components/TopBar';
import { useAuthGate } from '../features/auth/AuthGateProvider';
import { EditNameSheet } from '../features/profile/EditNameSheet';
import { ProfileTabs } from '../features/profile/ProfileTabs';
import { useProfileActivity } from '../features/profile/useProfileActivity';
import { StaffProfileButtons } from '../features/staff/StaffProfileButtons';
import { useCapabilities } from '../features/staff/useCapabilities';
import { navigateRoot, navigationRef } from '../navigation/types';
import { useTheme } from '../theme';

export function ProfileScreen() {
  const { colors, mode, toggleMode } = useTheme();
  const { user, isAuthenticated, signOut, refreshUser } = useAuth();
  const { promptSignIn } = useAuthGate();
  const { roleLabel, isStaff } = useCapabilities();
  const [editOpen, setEditOpen] = useState(false);
  const activity = useProfileActivity(user?.id, isAuthenticated);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) void refreshUser();
    }, [isAuthenticated, refreshUser]),
  );

  if (!isAuthenticated || !user) {
    return (
      <Screen>
        <TopBar title="Profile" />
        <EmptyState icon="user" title="Sign in to see your profile" message="Your questions, answers and stats live here." actionLabel="Sign in with Google" onAction={() => promptSignIn('Sign in to see your profile.')} />
      </Screen>
    );
  }

  const logOut = async () => {
    await signOut();
    navigationRef.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const { stats } = user;

  return (
    <Screen>
      <TopBar title="Profile" />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 88 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={activity.refreshing} onRefresh={() => { void refreshUser(); activity.refresh(); }} tintColor={colors.accent} colors={[colors.accent]} />}
      >
        <View style={[styles.card, { borderColor: colors.line }]}>
          <View style={styles.cardTop}>
            <Avatar name={user.full_name} uri={user.avatar} size={64} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={styles.nameRow}>
                <Text variant="h1" numberOfLines={1} style={{ flexShrink: 1 }}>
                  {user.full_name}
                </Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Edit name" onPress={() => setEditOpen(true)} style={styles.editButton}>
                  <Icon name="pen" size={13} color={colors.muted} />
                </Pressable>
              </View>
              <Text size={14} color={colors.muted} numberOfLines={1}>
                {user.email}
              </Text>
              {isStaff ? (
                <View style={[styles.roleBadge, { backgroundColor: colors.accentSoft }]}>
                  <Text size={11} color={colors.accent}>
                    {roleLabel}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={[styles.stats, { borderTopColor: colors.line }]}>
            <Stat first label="Questions" value={stats.question_count} />
            <Stat label="Answers" value={stats.answer_count} />
            <Stat label="Best answers" value={stats.best_answer_count} />
            <Stat label="Comments" value={stats.comment_count} />
          </View>
        </View>

        <StaffProfileButtons />
        <ProfileTabs activity={activity} />

        <View style={[styles.menu, { borderColor: colors.line }]}>
          <MenuRow icon="flag" label="My reports" onPress={() => navigateRoot('MyReports')} />
          <MenuRow icon="fileLines" label="Policies and guides" onPress={() => navigateRoot('Pages')} />
          <MenuRow icon={mode === 'dark' ? 'sun' : 'moon'} label={mode === 'dark' ? 'Light mode' : 'Dark mode'} onPress={toggleMode} noChevron />
          <MenuRow icon="logout" label="Log out" danger onPress={logOut} />
        </View>
      </ScrollView>

      <EditNameSheet visible={editOpen} onClose={() => setEditOpen(false)} />
    </Screen>
  );
}

function Stat({ label, value, first }: { label: string; value: number; first?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.stat, { borderLeftColor: colors.line, borderLeftWidth: first ? 0 : StyleSheet.hairlineWidth }]}>
      <Text size={18} weight="semibold">
        {value}
      </Text>
      <Text size={11} color={colors.muted} center>
        {label}
      </Text>
    </View>
  );
}

function MenuRow({ icon, label, onPress, danger, noChevron }: { icon: IconName; label: string; onPress: () => void; danger?: boolean; noChevron?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.menuRow, { borderBottomColor: colors.line, backgroundColor: pressed ? colors.subtle : 'transparent' }]}>
      <Icon name={icon} size={15} color={danger ? colors.danger : colors.muted} />
      <Text size={14} color={danger ? colors.danger : colors.ink} style={{ flex: 1 }}>
        {label}
      </Text>
      {!danger && !noChevron ? <Icon name="chevronRight" size={12} color={colors.muted} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { margin: 16, borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  roleBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginTop: 8 },
  stats: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  menu: { margin: 16, borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, minHeight: 48 },
});