import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, Field, PrimaryButton, Screen } from '@/components/stock-ui';
import { useAuth } from '@/context/AuthContext';

export default function EditProfileScreen() {
  const { user, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || user?.businessName || '');
  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    setError('');
    if (!displayName.trim()) return setError('Your name is required.');
    if (!businessName.trim()) return setError('Business name is required.');
    try {
      setIsSaving(true);
      await updateProfile(displayName.trim(), businessName.trim());
      router.back();
    } catch {
      setError('Could not update your profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return <Screen title="Edit profile" subtitle="Keep your account details up to date" back>
    <Field label="Your name" value={displayName} onChangeText={setDisplayName} placeholder="e.g. Ada Okafor" editable={!isSaving} />
    <Field label="Business name" value={businessName} onChangeText={setBusinessName} placeholder="e.g. Ada's Store" editable={!isSaving} />
    <Field label="Email" value={user?.email} editable={false} />
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <PrimaryButton label={isSaving ? 'Saving...' : 'Save changes'} onPress={save} disabled={isSaving} />
  </Screen>;
}

const styles = StyleSheet.create({ error: { color: colors.red, marginBottom: 8 } });
