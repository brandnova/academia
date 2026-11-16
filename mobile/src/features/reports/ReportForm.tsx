import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ApiError, errorMessage } from '../../api/client';
import { api } from '../../api/endpoints';
import type { ReportContentType, ReportType } from '../../api/types';
import { Button } from '../../components/Button';
import { FormError } from '../../components/Form';
import { Icon } from '../../components/Icon';
import { Text } from '../../components/Text';
import { useTheme, webInputReset } from '../../theme';

const REASONS: { label: string; value: ReportType }[] = [
  { label: 'Spam', value: 'SPAM' },
  { label: 'Abuse', value: 'ABUSE' },
  { label: 'Misinformation', value: 'MISINFORMATION' },
  { label: 'Duplicate', value: 'DUPLICATE' },
];

type Sent = 'report' | 'escalate' | 'already' | null;

interface ReportFormProps {
  contentType: ReportContentType;
  contentId: string;
  escalate: boolean;
  onClose: () => void;
}

/**
 * Report (or report then escalate) form. Renders its own heading so it can sit
 * inside any sheet. Escalate is one button: POST /reports/ then
 * POST /reports/{id}/escalate/.
 */
export function ReportForm({ contentType, contentId, escalate, onClose }: ReportFormProps) {
  const { colors } = useTheme();
  const [reason, setReason] = useState<ReportType>('SPAM');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [sent, setSent] = useState<Sent>(null);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const created = await api.reports.create({
        content_type: contentType,
        content_id: contentId,
        type: reason,
        description: details.trim() || undefined,
      });
      if (escalate) {
        await api.reports.escalate(created.id);
        setSent('escalate');
      } else {
        setSent('report');
      }
    } catch (err) {
      const alreadyReported =
        escalate && err instanceof ApiError && err.status === 400 && errorMessage(err).toLowerCase().includes('already reported');
      if (alreadyReported) setSent('already');
      else setError(err);
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    const copy =
      sent === 'escalate'
        ? 'Escalated. Every admin has been notified for priority review.'
        : sent === 'already'
          ? 'You already reported this content. An admin will review it from their dashboard.'
          : 'Thanks, this has been reported for review.';
    return (
      <View>
        <Text variant="title" style={{ marginBottom: 8 }}>
          {sent === 'report' ? 'Report submitted' : 'Escalated to admin'}
        </Text>
        <Text size={14} color={colors.muted} style={{ marginBottom: 16 }}>
          {copy}
        </Text>
        <Button title="Close" onPress={onClose} fullWidth />
      </View>
    );
  }

  return (
    <View>
      <Text variant="title" style={{ marginBottom: 8 }}>
        {escalate ? 'Escalate' : 'Report'} this {contentType}
      </Text>
      {escalate ? (
        <Text size={12} color={colors.muted} style={{ marginBottom: 12 }}>
          This goes straight to every admin for priority review, not a routine report.
        </Text>
      ) : null}
      <FormError message={error ? errorMessage(error) : null} />
      <Text size={12} color={colors.muted} style={{ marginBottom: 8 }}>
        Reason
      </Text>
      <View style={styles.reasons}>
        {REASONS.map((item) => {
          const active = reason === item.value;
          return (
            <Pressable
              key={item.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              onPress={() => setReason(item.value)}
              style={[styles.reason, { borderColor: active ? colors.accent : colors.line, backgroundColor: active ? colors.accentSoft : 'transparent' }]}
            >
              <Icon name={active ? 'checkCircle' : 'circle'} size={14} color={active ? colors.accent : colors.muted} />
              <Text size={14} color={active ? colors.accent : colors.ink}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text size={12} color={colors.muted} style={{ marginTop: 12, marginBottom: 4 }}>
        Details (optional)
      </Text>
      <TextInput
        value={details}
        onChangeText={setDetails}
        multiline
        placeholder="Add context for the admins..."
        placeholderTextColor={colors.muted}
        accessibilityLabel="Report details"
        style={[styles.details, webInputReset, { borderColor: colors.strong, color: colors.ink, backgroundColor: colors.surface }]}
      />
      <View style={styles.buttons}>
        <Button title="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
        <Button title={escalate ? 'Escalate' : 'Submit report'} onPress={submit} loading={busy} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reason: { width: '48%', flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10, minHeight: 44 },
  details: { borderWidth: 1, borderRadius: 8, minHeight: 80, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, textAlignVertical: 'top' },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 16 },
});