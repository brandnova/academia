import React, { useState } from 'react';

import { errorMessage, fieldError } from '../../api/client';
import { api } from '../../api/endpoints';
import type { School } from '../../api/types';
import { Button } from '../../components/Button';
import { FormError, TextArea } from '../../components/Form';
import { Sheet } from '../../components/Sheet';
import { Text } from '../../components/Text';
import { useTheme } from '../../theme';

/** Request hub activation for a school with no active hub. */
export function RequestHubSheet({ school, visible, onClose }: { school: School; visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.hubs.activationRequests.create({ school_id: school.id, notes: notes.trim() || undefined });
      setSent(true);
      setNotes('');
    } catch (err) {
      setError(fieldError(err, 'school_id') ?? errorMessage(err, 'Could not submit the request.'));
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    setSent(false);
    setError(null);
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={close} title="Request hub activation">
      <Text size={14} color={colors.muted} style={{ marginBottom: sent ? 18 : 14 }}>
        An admin will review this request before the hub goes live.
      </Text>
      {sent ? (
        <Button title="Close" onPress={close} fullWidth />
      ) : (
        <>
          <FormError message={error} />
          <TextArea label="Why does this school need a hub? (optional)" value={notes} onChangeText={setNotes} placeholder="Tell the admins why this hub matters." minHeight={96} maxLength={1000} />
          <Button title="Submit request" onPress={submit} loading={busy} fullWidth />
        </>
      )}
    </Sheet>
  );
}