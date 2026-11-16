import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import type { Hub, InstitutionType, Ownership, School } from '../../api/types';
import { Button } from '../../components/Button';
import { Icon, IconName } from '../../components/Icon';
import { Text } from '../../components/Text';
import { pluralize } from '../../lib/time';
import { startAsk } from '../../navigation/types';
import { useTheme } from '../../theme';

const TYPE_LABELS: Record<InstitutionType, string> = { UNIVERSITY: 'University', POLYTECHNIC: 'Polytechnic', COLLEGE_OF_EDUCATION: 'College of Education' };
const OWNERSHIP_LABELS: Record<Ownership, string> = { FEDERAL: 'Federal', STATE: 'State', PRIVATE: 'Private' };

function Fact({ icon, label, onPress, link }: { icon: IconName; label: string; onPress?: () => void; link?: boolean }) {
  const { colors } = useTheme();
  const body = (
    <>
      <Icon name={icon} size={13} color={colors.muted} />
      <Text size={14} color={link ? colors.accent : colors.muted}>
        {label}
      </Text>
    </>
  );
  return onPress ? (
    <Pressable accessibilityRole="link" accessibilityLabel={label} onPress={onPress} style={styles.fact}>
      {body}
    </Pressable>
  ) : (
    <View style={styles.fact}>{body}</View>
  );
}

/** School header: identity, classification, hub stats and the Ask action. */
export function SchoolHero({ school, hub }: { school: School; hub: Hub | null }) {
  const { colors } = useTheme();
  const row = (extra?: object) => [styles.factRow, extra, { borderTopColor: colors.line }];

  return (
    <View style={[styles.hero, { borderBottomColor: colors.line }]}>
      <View style={styles.nameRow}>
        <Text variant="h1" style={{ flexShrink: 1 }}>
          {school.name}
        </Text>
        {school.verification_status === 'VERIFIED' ? <Icon name="shield" size={14} color={colors.accent} /> : null}
      </View>
      <Text size={14} color={colors.muted} style={{ marginTop: 2 }}>
        {school.short_name}
      </Text>

      <View style={styles.factRow}>
        {school.location ? <Fact icon="location" label={school.location} /> : null}
        {school.website ? <Fact icon="globe" label="Website" link onPress={() => Linking.openURL(school.website as string).catch(() => {})} /> : null}
      </View>

      <View style={row(styles.border)}>
        {school.institution_type ? <Fact icon="landmark" label={TYPE_LABELS[school.institution_type]} /> : null}
        {school.ownership ? <Fact icon="shield" label={OWNERSHIP_LABELS[school.ownership]} /> : null}
        {school.state ? <Fact icon="map" label={school.state} /> : null}
      </View>

      {hub ? (
        <>
          <View style={row(styles.border)}>
            <Fact icon="messageRegular" label={pluralize(hub.question_count, 'question')} />
            <Fact icon="shieldUser" label={pluralize(hub.moderator_count, 'moderator')} />
          </View>
          <Button title="Ask a question" icon="plus" onPress={() => startAsk({ hubId: hub.id, schoolId: school.id, schoolName: school.name })} fullWidth style={{ marginTop: 16 }} />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  factRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 14, rowGap: 6, marginTop: 12 },
  border: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12 },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});