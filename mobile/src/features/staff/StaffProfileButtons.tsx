import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '../../components/Icon';
import { Text } from '../../components/Text';
import { useTheme } from '../../theme';
import { useCapabilities } from './useCapabilities';
import { useStaffWeb } from './StaffWebProvider';

export function StaffProfileButtons() {
  const { isStaff, isAdmin } = useCapabilities();
  const { openOnWeb } = useStaffWeb();

  if (!isStaff) return null;

  return (
    <View style={{ gap: 8, marginHorizontal: 16, marginBottom: 16 }}>
      <StaffButton
        icon="shield"
        label="Open moderation tools on web"
        onPress={() => openOnWeb('/moderation', 'Moderation tools')}
      />
      {isAdmin ? (
        <StaffButton
          icon="toolbox"
          label="Open admin dashboard on web"
          onPress={() => openOnWeb('/admin', 'Admin dashboard')}
        />
      ) : null}
    </View>
  );
}

function StaffButton({
  icon,
  label,
  onPress,
}: {
  icon: 'shield' | 'toolbox';
  label: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { borderColor: colors.line, backgroundColor: pressed ? colors.subtle : 'transparent' },
      ]}
    >
      <Icon name={icon} size={15} color={colors.accent} />
      <Text size={14} weight="semibold" style={{ flex: 1 }}>
        {label}
      </Text>
      <Icon name="external" size={12} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 48,
  },
});
