import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { errorMessage, fieldError } from '../../api/client';
import { useAuth } from '../../auth/AuthProvider';
import { Button } from '../../components/Button';
import { FormError, Input } from '../../components/Form';
import { Sheet } from '../../components/Sheet';

/** Edit the display name. Trimmed, blank blocked, backend field errors shown under the field. */
export function EditNameSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!visible) return;
    setName(user?.full_name ?? '');
    setError(null);
  }, [visible, user?.full_name]);

  const save = async () => {
    const clean = name.trim();
    if (!clean || busy) return;
    setBusy(true);
    setError(null);
    try {
      await updateProfile(clean);
      onClose();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const field = fieldError(error, 'full_name');

  return (
    <Sheet visible={visible} onClose={onClose} title="Edit your name">
      <FormError message={error && !field ? errorMessage(error) : null} />
      <Input value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" maxLength={150} error={field} />
      <View style={styles.buttons}>
        <Button title="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
        <Button title="Save" onPress={save} disabled={!name.trim()} loading={busy} style={{ flex: 1 }} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  buttons: { flexDirection: 'row', gap: 10, marginTop: 8 },
});