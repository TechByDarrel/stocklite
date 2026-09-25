import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SecondaryButton, useTheme } from '@/components/stock-ui';
import { PinInput } from '@/components/pin-input';
import { useAuth } from '@/context/AuthContext';
import { authenticateWithBiometrics, isBiometricAvailable } from '@/utils/biometrics';

export function AppLockScreen({ onUnlock }: { onUnlock: () => void }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { user, getBiometricAccount, getPinAccount, verifyPin } = useAuth();
  const [pinValue, setPinValue] = useState('');
  const [error, setError] = useState('');
  const [hasBiometric, setHasBiometric] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) {
        setChecking(false);
        return;
      }
      const bioAvailable = await isBiometricAvailable();
      if (bioAvailable) {
        const bioAccount = await getBiometricAccount();
        setHasBiometric(bioAccount?.id === user.id);
      }
      const pinAccount = await getPinAccount();
      setHasPin(pinAccount?.id === user.id);
      setChecking(false);
    })();
  }, []);

  const handleBiometricUnlock = async () => {
    setError('');
    const success = await authenticateWithBiometrics();
    if (success) {
      onUnlock();
    }
  };

  const handlePinChange = async (value: string) => {
    setPinValue(value);
    if (value.length !== 4) return;
    setError('');

    const isCorrect = await verifyPin(value);
    if (isCorrect) {
      onUnlock();
    } else {
      setError('Incorrect PIN. Please try again.');
      setPinValue('');
    }
  };

  if (checking) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
        <Text style={styles.title}>StockLite is locked</Text>
        <Text style={styles.subtitle}>Unlock to continue</Text>

        {hasBiometric ? (
          <SecondaryButton label="Unlock with biometrics" onPress={handleBiometricUnlock} />
        ) : null}

        {hasPin ? (
          <View style={styles.pinSection}>
            <Text style={styles.pinPrompt}>Enter your PIN</Text>
            <PinInput value={pinValue} onChangeText={handlePinChange} length={4} />
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center', zIndex: 999 },
    content: { alignItems: 'center', gap: 16, padding: 24 },
    logo: { width: 64, height: 64, borderRadius: 16 },
    title: { color: colors.ink, fontSize: 22, fontWeight: '800' },
    subtitle: { color: colors.muted, fontSize: 14, marginBottom: 12 },
    pinSection: { alignItems: 'center', gap: 12, marginTop: 8 },
    pinPrompt: { color: colors.ink, fontWeight: '700', fontSize: 15 },
    error: { color: colors.red, marginTop: 8 },
  });
}