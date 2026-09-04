import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, PrimaryButton, Screen, SectionHeader } from '@/components/stock-ui';
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const displayName = user?.displayName || user?.businessName || 'Business owner';
  const initials = displayName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return <Screen title="Profile" subtitle="Your account and business details">
    <View style={styles.identity}>
      <View style={styles.avatar}><Text style={styles.initials}>{initials}</Text></View>
      <View style={styles.identityText}><Text style={styles.name}>{displayName}</Text><Text style={styles.email}>{user?.email}</Text></View>
    </View>
    <SectionHeader title="Business" />
    <View style={styles.details}>
      <Text style={styles.label}>Business name</Text><Text style={styles.value}>{user?.businessName || 'Not set'}</Text>
      <Text style={styles.label}>Account email</Text><Text style={styles.value}>{user?.email}</Text>
    </View>
    <SectionHeader title="Account" />
    <Pressable accessibilityRole="button" style={styles.action} onPress={() => router.push('/edit-profile' as never)}><Text style={styles.actionText}>Edit profile</Text><Text style={styles.chevron}>›</Text></Pressable>
    <PrimaryButton label="Log out" onPress={handleLogout} />
    <Text style={styles.note}>StockLite keeps your business records separate from your account details.</Text>
  </Screen>;
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  initials: { color: colors.white, fontSize: 20, fontWeight: '800' },
  identityText: { marginLeft: 16, flex: 1 },
  name: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  email: { color: colors.muted, marginTop: 4 },
  details: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 16 },
  label: { color: colors.muted, fontSize: 12, marginBottom: 4 },
  value: { color: colors.ink, fontWeight: '700', marginBottom: 16 },
  action: { minHeight: 48, paddingHorizontal: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actionText: { color: colors.ink, fontWeight: '700' },
  chevron: { color: colors.green, fontSize: 24 },
  note: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 20 },
});
