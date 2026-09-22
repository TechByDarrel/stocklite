import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, Screen, useTheme } from '@/components/stock-ui';
import { PinInput } from '@/components/pin-input';
import { useAuth } from '@/context/AuthContext';

export default function SetPinScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { setPin } = useAuth();
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [firstPin, setFirstPin] = useState('');
  const [pin, setPinValue] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handlePinChange = async (value: string) => {
    setPinValue(value);
    setError('');

    if (value.length !== 4) return;

    if (step === 'enter') {
      setFirstPin(value);
      setPinValue('');
      setStep('confirm');
      return;
    }

    if (value !== firstPin) {
      setError('PINs do not match. Try again.');
      setPinValue('');
      setFirstPin('');
      setStep('enter');
      return;
    }

    try {
      setIsSaving(true);
      await setPin(value);
      router.back();
    } catch {
      setError('Could not save PIN. Please try again.');
      setPinValue('');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Screen title={step === 'enter' ? 'Set a PIN' : 'Confirm your PIN'} subtitle="Use a 4-digit PIN to unlock StockLite quickly" back>
      <View style={styles.pinWrap}>
        <PinInput value={pin} onChangeText={handlePinChange} length={4} />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {isSaving ? <Text style={styles.saving}>Saving...</Text> : null}
    </Screen>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    pinWrap: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
    error: { color: colors.red, textAlign: 'center', marginTop: 12 },
    saving: { color: colors.muted, textAlign: 'center', marginTop: 12 },
  });
}