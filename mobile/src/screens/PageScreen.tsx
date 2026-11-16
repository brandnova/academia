import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { api } from '../api/endpoints';
import { Markdown } from '../components/Markdown';
import { Screen } from '../components/Screen';
import { ErrorState, SkeletonQuestionList } from '../components/States';
import { Text } from '../components/Text';
import { TopBar } from '../components/TopBar';
import { useQuery } from '../lib/useQuery';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'PageView'>;

export function PageScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const { slug, title } = useRoute<RouteProp<RootStackParamList, 'PageView'>>().params;
  const page = useQuery((signal) => api.pages.get(slug, signal), [slug]);

  return (
    <Screen>
      <TopBar title={title ?? page.data?.title ?? 'Page'} onBack={() => navigation.goBack()} />

      {page.loading && !page.data ? (
        <SkeletonQuestionList rows={6} />
      ) : page.error ? (
        <ErrorState error={page.error} onRetry={page.refetch} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text variant="h1" style={{ marginBottom: 16 }}>
            {page.data?.title}
          </Text>
          {page.data?.body ? (
            <Markdown markdown={page.data.body} allowHeadings />
          ) : (
            <Text size={14} color={colors.muted}>
              This page has no content yet.
            </Text>
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
});