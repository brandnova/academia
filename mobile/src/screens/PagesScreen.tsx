import React from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { api } from '../api/endpoints';
import type { Page } from '../api/types';
import { Badge } from '../components/Chips';
import { Icon } from '../components/Icon';
import { Screen } from '../components/Screen';
import { EmptyState, ErrorState, SkeletonQuestionList } from '../components/States';
import { Text } from '../components/Text';
import { TopBar } from '../components/TopBar';
import { useQuery } from '../lib/useQuery';
import { useRefreshOnFocus } from '../lib/useRefreshOnFocus';
import { navigateRoot, RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Pages'>;

export function PagesScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const pages = useQuery((signal) => api.pages.list(signal), []);
  useRefreshOnFocus(pages.refetch);

  return (
    <Screen>
      <TopBar title="Policies and guides" onBack={() => navigation.goBack()} />

      <FlatList
        data={pages.data?.results ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PageRow page={item} onPress={() => navigateRoot('PageView', { slug: item.slug, title: item.title })} />}
        ListEmptyComponent={
          pages.loading ? (
            <SkeletonQuestionList rows={4} />
          ) : pages.error ? (
            <ErrorState error={pages.error} onRetry={pages.refetch} />
          ) : (
            <EmptyState icon="fileLines" title="No pages yet" message="Policies and guides will appear here." />
          )
        }
        refreshControl={<RefreshControl refreshing={pages.refreshing} onRefresh={pages.refetch} tintColor={colors.accent} colors={[colors.accent]} />}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

function PageRow({ page, onPress }: { page: Page; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={page.title} onPress={onPress} style={({ pressed }) => [styles.row, { borderBottomColor: colors.line, backgroundColor: pressed ? colors.subtle : 'transparent' }]}>
      <Text size={14} style={{ flex: 1 }}>
        {page.title}
      </Text>
      <View style={styles.badges}>
        {page.visibility === 'STAFF' ? <Badge label="Staff" tone="accent" /> : null}
        {!page.is_published ? <Badge label="Draft" /> : null}
      </View>
      <Icon name="chevronRight" size={12} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, minHeight: 52 },
  badges: { flexDirection: 'row', gap: 6 },
});