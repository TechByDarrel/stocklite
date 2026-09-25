import { AuthProvider, useAuth } from '@/context/AuthContext';
import { StockLiteProvider } from '@/context/StockLiteContext';
import { Redirect, Stack, useSegments } from 'expo-router';
import Head from 'expo-router/head';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors, ThemeProvider } from '@/components/stock-ui';
import { AppLockScreen } from '@/components/app-lock-screen';
import { useEffect, useState } from 'react';
import { startAutoSync } from '@/sync/syncService';
import { startAppLockWatcher, onAppLockStateChange } from '@/utils/appLock';

function RootLayoutContent() {
  const { isSignedIn, isLoading, user, getBiometricAccount, getPinAccount } = useAuth();
  const segments = useSegments();
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (!isSignedIn) return;
    const stopSync = startAutoSync();
    return () => stopSync();
  }, [isSignedIn]);

  useEffect(() => {
    if (!isSignedIn || !user) return;
    let stopWatcher: (() => void) | undefined;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      const [bioAccount, pinAccount] = await Promise.all([getBiometricAccount(), getPinAccount()]);
      const hasFastAuth = bioAccount?.id === user.id || pinAccount?.id === user.id;
      if (!hasFastAuth) return;

      stopWatcher = startAppLockWatcher();
      unsubscribe = onAppLockStateChange((shouldLock) => {
        if (shouldLock) setIsLocked(true);
      });
    })();

    return () => {
      stopWatcher?.();
      unsubscribe?.();
    };
  }, [isSignedIn, user?.id]);

  if (isLoading) {
    return <View style={styles.loading}><ActivityIndicator color={colors.green} /><View style={styles.loadingBar} /></View>;
  }

  const isAuthRoute = segments[0] === 'login' || segments[0] === 'signup';

  if (!isSignedIn && !isAuthRoute) return <Redirect href="/login" />;
  if (isSignedIn && isAuthRoute) return <Redirect href="/" />;

  if (isSignedIn && isLocked) {
    return <AppLockScreen onUnlock={() => setIsLocked(false)} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper, gap: 14 },
  loadingBar: { width: 44, height: 3, backgroundColor: colors.mint, borderRadius: 2 },
});

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StockLiteProvider>
          <Head>
            <title>StockLite</title>
          </Head>
          <RootLayoutContent />
        </StockLiteProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}