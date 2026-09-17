import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Field, PrimaryButton, Screen } from '@/components/stock-ui';
import { colors } from '@/components/stock-ui';

const MAX_NAME_LENGTH = 60;
const MAX_EMAIL_LENGTH = 100;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getPasswordStrength(password: string): { label: 'Weak' | 'Medium' | 'Strong'; score: number; color: string } {
  if (password.length < 6) return { label: 'Weak', score: 1, color: colors.red };
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  if (password.length < 10 || !hasUpper || !hasNumber) return { label: 'Medium', score: 2, color: colors.yellow };
  return { label: 'Strong', score: 3, color: colors.green };
}

export default function SignupScreen() {
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const strength = getPasswordStrength(password);

  const handleSignup = async () => {
    setError('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Please enter a valid email');
      return;
    }

    if (!password) {
      setError('Password is required');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!businessName.trim()) {
      setError('Business name is required');
      return;
    }

    try {
      setIsLoading(true);
      await signup(email.trim(), password, businessName.trim());
      router.replace('/' as never);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.brand}>StockLite</Text>
        <Text style={styles.title}>Set up your business</Text>
        <Text style={styles.subtitle}>Create an account to start tracking your shop.</Text>
      </View>

      <View style={styles.formContainer}>
        <Field
          label="Business name"
          value={businessName}
          onChangeText={setBusinessName}
          placeholder="Your shop or business name"
          editable={!isLoading}
          maxLength={MAX_NAME_LENGTH}
        />
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="name@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isLoading}
          maxLength={MAX_EMAIL_LENGTH}
        />

        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="At least 6 characters"
          secureTextEntry
          editable={!isLoading}
        />

        {password ? (
          <View style={styles.strengthWrap}>
            <View style={styles.strengthTrack}>
              <View style={[styles.strengthFill, { width: `${(strength.score / 3) * 100}%`, backgroundColor: strength.color }]} />
            </View>
            <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
          </View>
        ) : null}

        <Field
          label="Confirm password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Re-enter your password"
          secureTextEntry
          editable={!isLoading}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

               <PrimaryButton
          label={isLoading ? 'Creating account...' : 'Create account'}
          onPress={handleSignup}
          disabled={isLoading}
          loading={isLoading}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <Pressable onPress={() => router.replace('/login' as never)} disabled={isLoading}>
          <Text style={styles.link}>Sign in</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  brand: {
    color: colors.green,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 26,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.muted,
    lineHeight: 21,
  },
  formContainer: {
    marginBottom: 24,
    gap: 16,
  },
  error: {
    color: '#a13f32',
    fontSize: 14,
    marginTop: 8,
  },
  strengthWrap: {
    marginTop: -8,
    gap: 5,
  },
  strengthTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    overflow: 'hidden',
  },
  strengthFill: {
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '700',
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