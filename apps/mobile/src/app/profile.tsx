import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, pickImage, PrimaryButton, Screen, SectionHeader, useTheme } from '@/components/stock-ui';
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
  const { user, logout, updateProfilePhoto } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const displayName = user?.displayName || user?.businessName || 'Business owner';
  const initials = displayName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const handleChangePhoto = async () => {
    const uri = await pickImage();
    if (uri) await updateProfilePhoto(uri);
  };

  return <Screen title="Profile" subtitle="Your account and business details">
    <View style={styles.identity}>
      <Pressable accessibilityRole="button" accessibilityLabel="Change profile photo" onPress={handleChangePhoto} style={styles.avatarWrap}>
        <View style={styles.avatar}>
          {user?.photoUri ? (
            <Image source={{ uri: user.photoUri }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.initials}>{initials}</Text>
          )}
        </View>
        <View style={styles.avatarBadge}><Text style={styles.avatarBadgeText}>+</Text></View>
      </Pressable>
      <View style={styles.identityText}>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Pressable onPress={handleChangePhoto}><Text style={styles.photoLink}>{user?.photoUri ? 'Change photo' : 'Add photo'}</Text></Pressable>
      </View>
    </View>
    <SectionHeader title="Business" />
    <View style={styles.details}>
      <Text style={styles.label}>Business name</Text><Text style={styles.value}>{user?.businessName || 'Not set'}</Text>
      <Text style={styles.label}>Account email</Text><Text style={styles.value}>{user?.email}</Text>
    </View>
        <SectionHeader title="Preferences" />
    <Pressable accessibilityRole="button" style={styles.action} onPress={toggleTheme}>
      <Text style={styles.actionText}>Dark mode</Text>
      <Text style={styles.toggleValue}>{isDark ? 'On' : 'Off'}</Text>
    </Pressable>
    <SectionHeader title="Account" />
    <Pressable accessibilityRole="button" style={styles.action} onPress={() => router.push('/edit-profile' as never)}><Text style={styles.actionText}>Edit profile</Text><Text style={styles.chevron}>›</Text></Pressable>
    <PrimaryButton label="Log out" onPress={handleLogout} />
    <Text style={styles.note}>StockLite keeps your business records separate from your account details.</Text>
  </Screen>;
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  avatarWrap: { width: 64, height: 64 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: 64, height: 64, borderRadius: 32 },
  avatarBadge: { position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.paper },
  avatarBadgeText: { color: colors.ink, fontWeight: '800', fontSize: 14, lineHeight: 16 },
  initials: { color: colors.white, fontSize: 20, fontWeight: '800' },
  identityText: { marginLeft: 16, flex: 1 },
  name: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  email: { color: colors.muted, marginTop: 4 },
  photoLink: { color: colors.green, fontWeight: '700', marginTop: 6, fontSize: 13 },
  details: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 16 },
  label: { color: colors.muted, fontSize: 12, marginBottom: 4 },
  value: { color: colors.ink, fontWeight: '700', marginBottom: 16 },
  action: { minHeight: 48, paddingHorizontal: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actionText: { color: colors.ink, fontWeight: '700' },
    chevron: { color: colors.green, fontSize: 24 },
  toggleValue: { color: colors.green, fontWeight: '800', fontSize: 14 },
  note: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 20 },
});