import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Field, PrimaryButton, Screen } from '@/components/stock-ui';
import { colors } from '@/components/stock-ui';

export default function SignupScreen() {
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const passwordStrength = password.length < 6 ? 'Weak' : password.length < 10 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) ? 'Medium' : 'Strong';

  const handleSignup = async () => {
    setError('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!email.includes('@')) {
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
        />
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
          placeholder="At least 6 characters"
          secureTextEntry
          editable={!isLoading}
        />

        {password ? <Text style={styles.passwordStrength}>Password strength: {passwordStrength}</Text> : null}

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
  passwordStrength: {
    color: colors.muted,
    fontSize: 13,
    marginTop: -8,
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
