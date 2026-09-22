import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Image } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Field, PrimaryButton, SecondaryButton, useTheme } from '@/components/stock-ui';
import { isBiometricAvailable, authenticateWithBiometrics } from '@/utils/biometrics';
import { PinInput } from '@/components/pin-input';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ThemeColors = ReturnType<typeof useTheme>['colors'];

// In-memory only: resets on app reload. This is a basic deterrent against
// casual repeated guessing, not a substitute for real backend rate-limiting.
const attemptsByEmail = new Map<string, { count: number; lockedUntil: number }>();

export default function LoginScreen() {
  const { colors: c } = useTheme();
  const styles = makeStyles(c);
    const { login, getBiometricAccount, loginWithBiometricAccount, getPinAccount, loginWithPin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
   const [biometricLabel, setBiometricLabel] = useState<string | null>(null);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [pinLabel, setPinLabel] = useState<string | null>(null);
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [isPinLoading, setIsPinLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const available = await isBiometricAvailable();
      if (available) {
        const account = await getBiometricAccount();
        if (account) {
          setBiometricLabel(account.displayName || account.businessName || account.email);
        }
      }
      const pinAccount = await getPinAccount();
      if (pinAccount) {
        setPinLabel(pinAccount.displayName || pinAccount.businessName || pinAccount.email);
      }
    })();
  }, []);
  
  const handleLogin = async () => {
    setError('');
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError('Email is required');
      return;
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setError('Please enter a valid email');
      return;
    }

    if (!password) {
      setError('Password is required');
      return;
    }

    const record = attemptsByEmail.get(normalizedEmail);
    if (record && record.lockedUntil > Date.now()) {
      const secondsLeft = Math.ceil((record.lockedUntil - Date.now()) / 1000);
      setError(`Too many attempts. Please try again in ${secondsLeft}s.`);
      return;
    }

    try {
      setIsLoading(true);
      await login(email.trim(), password);
      attemptsByEmail.delete(normalizedEmail);
      router.replace('/' as never);
    } catch (err) {
      const current = attemptsByEmail.get(normalizedEmail) || { count: 0, lockedUntil: 0 };
      const nextCount = current.count + 1;
      const lockedUntil = nextCount >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : 0;
      attemptsByEmail.set(normalizedEmail, { count: nextCount, lockedUntil });

      if (lockedUntil) {
        setError(`Too many failed attempts. Please try again in ${Math.ceil(LOCKOUT_MS / 1000)}s.`);
      } else {
        const message = err instanceof Error ? err.message : 'Login failed';
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setError('');
    try {
      setIsBiometricLoading(true);
      const account = await getBiometricAccount();
      if (!account) {
        setError('No biometric-enabled account found. Please sign in with your password.');
        return;
      }
      const success = await authenticateWithBiometrics();
      if (!success) {
        return;
      }
      await loginWithBiometricAccount(account);
      router.replace('/' as never);
    } catch (err) {
      setError('Biometric login failed. Please sign in with your password.');
    } finally {
      setIsBiometricLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
        <Text style={styles.brand}>StockLite</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to keep your shop moving.</Text>
      </View>

      {biometricLabel ? (
        <View style={styles.biometricSection}>
          <SecondaryButton
            label={isBiometricLoading ? 'Verifying...' : `Unlock as ${biometricLabel}`}
            onPress={handleBiometricLogin}
          />
          <Text style={styles.orDivider}>or sign in with password</Text>
        </View>
      ) : null}

      <View style={styles.formContainer}>
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="name@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isLoading}
        />

        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          secureTextEntry
          editable={!isLoading}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton
          label={isLoading ? 'Signing in...' : 'Sign in'}
          onPress={handleLogin}
          disabled={isLoading}
          loading={isLoading}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>New to StockLite? </Text>
        <Pressable onPress={() => router.replace('/signup' as never)} disabled={isLoading}>
          <Text style={styles.link}>Create one</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.white,
    },
    contentContainer: {
      flexGrow: 1,
      padding: 16,
      justifyContent: 'center',
    },
    header: {
      marginBottom: 32,
      paddingHorizontal: 8,
    },
    logo: {
      width: 56,
      height: 56,
      borderRadius: 14,
      marginBottom: 16,
    },
    brand: {
      color: colors.green,
      fontSize: 18,
      fontWeight: '800',
      letterSpacing: 0.3,
      marginBottom: 26,
    },
    title: {
      fontSize: 32,
      fontWeight: '800',
      color: colors.ink,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 15,
      color: colors.muted,
      lineHeight: 21,
    },
    biometricSection: {
      marginBottom: 20,
      gap: 8,
    },
    orDivider: {
      textAlign: 'center',
      color: colors.muted,
      fontSize: 13,
    },
    formContainer: {
      marginBottom: 24,
      gap: 16,
    },
    error: {
      color: colors.red,
      fontSize: 14,
      marginTop: 8,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 8,
    },
    footerText: {
      fontSize: 14,
      color: colors.muted,
    },
    link: {
      fontSize: 14,
      color: colors.green,
      fontWeight: '600',
    },
  });
}