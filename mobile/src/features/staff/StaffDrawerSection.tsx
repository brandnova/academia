import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '../../components/Icon';
import { Text } from '../../components/Text';
import { useTheme } from '../../theme';
import { useStaffWeb } from './StaffWebProvider';
import { useCapabilities } from './useCapabilities';

export function StaffDrawerSection({ beforeOpen }: { beforeOpen?: () => void }) {
  const { colors } = useTheme();
  const { isStaff, isAdmin } = useCapabilities();
  const { openOnWeb } = useStaffWeb();

  if (!isStaff) return null;

  const open = (path: string, label: string) => {
    beforeOpen?.();
    setTimeout(() => openOnWeb(path, label), 220);
  };

  return (
    <View style={[styles.section, { borderTopColor: colors.line }]}>
      <Text variant="label" color={colors.muted} style={styles.label}>
        Staff tools (web)
      </Text>
      <StaffLink icon="shield" label="Moderation" onPress={() => open('/moderation', 'Moderation tools')} />
      {isAdmin ? <StaffLink icon="toolbox" label="Admin dashboard" onPress={() => open('/admin', 'Admin dashboard')} /> : null}
    </View>
  );
}

function StaffLink({ icon, label, onPress }: { icon: 'shield' | 'toolbox'; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.link, { backgroundColor: pressed ? colors.subtle : 'transparent' }]}>
      <Icon name={icon} size={15} color={colors.muted} />
      <Text size={14} color={colors.ink} style={{ flex: 1 }}>
        {label}
      </Text>
      <Icon name="external" size={11} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 12, paddingTop: 12 },
  label: { paddingHorizontal: 12, marginBottom: 4 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 8, minHeight: 44 },
});