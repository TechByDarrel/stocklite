import { router } from 'expo-router';
import { Platform } from 'react-native';
import { PrimaryButton, Screen, SecondaryButton, useTheme } from '@/components/stock-ui';
import { useAuth } from '@/context/AuthContext';
import { StyleSheet, Text } from 'react-native';
import { useState } from 'react';

export default function ChangePinScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { clearPin } = useAuth();
  const [error, setError] = useState('');
  const [isRemoving, setIsRemoving] = useState(false);

  const confirmRemove = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Remove your PIN? You will need your password to log in.')) {
        runRemove();
      }
      return;
    }
    import('react-native').then(({ Alert }) => {
      Alert.alert('Remove PIN', 'Remove your PIN? You will need your password to log in.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: runRemove },
      ]);
    });
  };

  const runRemove = async () => {
    try {
      setIsRemoving(true);
      await clearPin();
      router.back();
    } catch {
      setError('Could not remove PIN. Please try again.');
      setIsRemoving(false);
    }
  };

  return (
    <Screen title="PIN login" subtitle="Update or remove your PIN" back>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Set a new PIN" onPress={() => router.replace('/set-pin' as never)} />
      <SecondaryButton label={isRemoving ? 'Removing...' : 'Remove PIN'} onPress={confirmRemove} />
    </Screen>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    error: { color: colors.red, marginBottom: 8, textAlign: 'center' },
  });
}