import { AuthProvider, useAuth } from '@/context/AuthContext';
import { StockLiteProvider } from '@/context/StockLiteContext';
import { Redirect, Stack, useSegments } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '@/components/stock-ui';

function RootLayoutContent() {
  const { isSignedIn, isLoading } = useAuth();
  const segments = useSegments();

  if (isLoading) {
    return <View style={styles.loading}><ActivityIndicator color={colors.green} /><View style={styles.loadingBar} /></View>;
  }

  const isAuthRoute = segments[0] === 'login' || segments[0] === 'signup';

  if (!isSignedIn && !isAuthRoute) return <Redirect href="/login" />;
  if (isSignedIn && isAuthRoute) return <Redirect href="/" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper, gap: 14 },
  loadingBar: { width: 44, height: 3, backgroundColor: colors.mint, borderRadius: 2 },
});

export default function RootLayout() {
  return (
    <AuthProvider>
      <StockLiteProvider>
        <RootLayoutContent />
      </StockLiteProvider>
    </AuthProvider>
  );
}
