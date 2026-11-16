import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text } from './Text';
import { useTheme } from '../theme';

export interface TabItem {
  key: string;
  label: string;
}

/** Underlined tab strip. Scrolls sideways instead of wrapping, like the web Tabs. */
export function Tabs({ tabs, value, onChange }: { tabs: TabItem[]; value: string; onChange: (key: string) => void }) {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal accessibilityRole="tablist" showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={[styles.row, { borderBottomColor: colors.line }]}>
      {tabs.map((tab) => {
        const active = tab.key === value;
        return (
          <Pressable key={tab.key} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => onChange(tab.key)} style={[styles.tab, { borderBottomColor: active ? colors.accent : 'transparent' }]}>
            <Text size={14} weight={active ? 'semibold' : 'regular'} color={active ? colors.accent : colors.muted}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 8 },
  tab: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 2, minHeight: 44, justifyContent: 'center' },
});