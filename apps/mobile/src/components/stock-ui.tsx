import { router } from 'expo-router';
import { createContext, PropsWithChildren, ReactNode, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { formatNaira } from '@/utils/currency';
import type { Debt, Expense, Product, Sale } from '@/types';
import { useAuth } from '@/context/AuthContext';

const lightColors = { ink: '#1A2E22', muted: '#8B8172', line: '#E8E1D3', paper: '#F7F4EC', white: '#FFFFFF', green: '#2D5C3E', mint: '#E4EBE0', yellow: '#EFD9A8', red: '#C9622D' };
const darkColors = { ink: '#EDEEE9', muted: '#9FA89B', line: '#2E362F', paper: '#14180F', white: '#1E2419', green: '#4A8C64', mint: '#233428', yellow: '#EFD9A8', red: '#D9765A' };

type ColorSet = typeof lightColors;

type ThemeContextValue = { isDark: boolean; toggleTheme: () => void; colors: ColorSet };
const ThemeContext = createContext<ThemeContextValue>({ isDark: false, toggleTheme: () => {}, colors: lightColors });
const THEME_KEY = 'stocklite.theme';

export function ThemeProvider({ children }: PropsWithChildren) {
  const [isDark, setIsDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_KEY);
        if (saved === 'dark') setIsDark(true);
      } catch (error) {
        console.warn('Failed to load theme preference:', error);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const toggleTheme = () => {
    setIsDark((current) => {
      const next = !current;
      AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light').catch((error) => {
        console.warn('Failed to save theme preference:', error);
      });
      return next;
    });
  };

  if (!ready) return null;

  return <ThemeContext.Provider value={{ isDark, toggleTheme, colors: isDark ? darkColors : lightColors }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

// Backward-compatible export: components/screens that still import `colors`
// directly get the light palette. All components inside this file use
// `useTheme().colors` internally so they react live to the toggle.
export const colors = lightColors;

function makeStyles(c: ColorSet) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.paper },
    content: { width: '100%', maxWidth: 980, alignSelf: 'center', padding: 20, paddingBottom: 110 },
    topbar: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    brandAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: c.green, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    brandAvatarImage: { width: 28, height: 28, borderRadius: 14 },
    brandAvatarText: { color: c.white, fontSize: 11, fontWeight: '800' },
    brand: { color: c.green, fontWeight: '800', fontSize: 18 },
    back: { color: c.green, fontSize: 16, fontWeight: '700' },
    heading: { marginTop: 20, marginBottom: 22 },
    title: { color: c.ink, fontSize: 30, fontWeight: '800' },
    subtitle: { color: c.muted, marginTop: 6, fontSize: 15 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 12 },
    sectionTitle: { color: c.ink, fontSize: 19, fontWeight: '800' },
    link: { color: c.green, fontWeight: '700' },
    stat: { backgroundColor: c.white, borderWidth: 1, borderColor: c.line, padding: 17, borderRadius: 10, minWidth: 140, flex: 1 },
    statAccent: { backgroundColor: c.green, borderColor: c.green },
    statLabel: { color: c.muted, fontSize: 13, marginBottom: 9 },
    statValue: { color: c.ink, fontSize: 22, fontWeight: '800', fontFamily: Platform.OS === 'web' ? 'Georgia, serif' : 'serif' },
    lightText: { color: c.white },
    statRow: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: c.white, borderWidth: 1, borderColor: c.line, borderRadius: 10, marginTop: 10 },
    statRowItem: { width: '33.33%', paddingVertical: 14, paddingHorizontal: 6, alignItems: 'center', minWidth: 0 },
    statRowDivider: { borderRightWidth: 1, borderRightColor: c.line },
    statRowValue: { color: c.ink, fontSize: 14, fontWeight: '800', fontFamily: Platform.OS === 'web' ? 'Georgia, serif' : 'serif' },
    statRowLabel: { color: c.muted, fontSize: 11, marginTop: 4, textAlign: 'center' },
    primary: { backgroundColor: c.green, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 8, transitionProperty: 'transform, background-color, box-shadow', transitionDuration: '150ms' } as any,
    primaryRow: { flexDirection: 'row', justifyContent: 'center' },
    primarySpinner: { marginRight: 8 },
    primaryHovered: { backgroundColor: '#254a32', transform: [{ translateY: -1 }], boxShadow: '0 4px 10px rgba(26,46,34,0.18)' } as any,
    primaryPressed: { transform: [{ translateY: 0 }], backgroundColor: '#1f3f2a' } as any,
    primaryText: { color: c.white, fontWeight: '800', fontSize: 15 },
    secondary: { backgroundColor: c.mint, borderRadius: 8, paddingVertical: 13, alignItems: 'center', marginTop: 8, transitionProperty: 'transform, background-color', transitionDuration: '150ms' } as any,
    secondaryHovered: { backgroundColor: '#d8e2d2', transform: [{ translateY: -1 }] } as any,
    secondaryPressed: { transform: [{ translateY: 0 }] } as any,
    secondaryText: { color: c.green, fontWeight: '800' },
    actionTile: { backgroundColor: c.mint, borderRadius: 8, padding: 15, minWidth: 145, flexGrow: 1, transitionProperty: 'transform, background-color, box-shadow', transitionDuration: '150ms' } as any,
    actionTileHovered: { backgroundColor: '#d8e2d2', transform: [{ translateY: -1 }], boxShadow: '0 4px 10px rgba(26,46,34,0.12)' } as any,
    actionTilePressed: { transform: [{ translateY: 0 }] } as any,
    actionTileText: { color: c.green, fontWeight: '800' },
    disabled: { opacity: 0.45 },
    empty: { borderWidth: 1, borderColor: c.line, backgroundColor: c.white, borderRadius: 10, padding: 28, alignItems: 'center' },
    emptyMark: { color: c.green, fontSize: 28, fontWeight: '300' },
    emptyTitle: { color: c.ink, fontWeight: '800', fontSize: 16, marginTop: 8 },
    emptyText: { color: c.muted, textAlign: 'center', marginTop: 5, lineHeight: 20 },
    row: { backgroundColor: c.white, borderBottomWidth: 1, borderBottomColor: c.line, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
    rowThumbWrap: { marginRight: 2 },
    rowThumb: { width: 40, height: 40, borderRadius: 8 },
    rowThumbPlaceholder: { backgroundColor: c.mint },
    rowThumbCount: { backgroundColor: c.green, alignItems: 'center', justifyContent: 'center' },
    rowThumbCountText: { color: c.white, fontWeight: '800', fontSize: 14 },
    rowMain: { flex: 1 },
    rowRight: { alignItems: 'flex-end' },
    rowTitle: { color: c.ink, fontSize: 15, fontWeight: '800' },
    rowMeta: { color: c.muted, fontSize: 13, marginTop: 5 },
    profit: { color: c.green, fontSize: 12, marginTop: 5, fontWeight: '700' },
    badge: { fontSize: 12, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5, overflow: 'hidden', marginTop: 5 },
    badgeLow: { color: c.red, backgroundColor: c.mint },
    badgeGood: { color: c.green, backgroundColor: c.mint },
    badgeOverdue: { color: c.white, backgroundColor: c.red },
    field: { marginBottom: 14 },
    fieldLabel: { color: c.ink, fontWeight: '700', marginBottom: 7 },
    input: { backgroundColor: c.white, borderWidth: 1, borderColor: c.line, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, color: c.ink, fontSize: 16 },
    error: { color: c.red, fontSize: 12, marginTop: 5 },
    photoPickerWrap: { alignItems: 'center', marginBottom: 18, gap: 8 },
    photoCircle: { backgroundColor: c.mint, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: c.line },
    photoPlaceholder: { color: c.green, fontSize: 28, fontWeight: '300' },
    photoActions: { flexDirection: 'row', gap: 16 },
    topbarRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    syncBadge: { fontSize: 11, fontWeight: '700' },
    nav: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: c.white, borderTopWidth: 1, borderTopColor: c.line, flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8, paddingBottom: 12 },
    navItem: { alignItems: 'center', minWidth: 46 },
    navIcon: { color: c.green, fontSize: 18, fontWeight: '800' },
    navLabel: { color: c.muted, fontSize: 10, marginTop: 3 },
  });
}

function SyncBadge() {
  const { colors: c } = useTheme();
  const styles = makeStyles(c);
  const [status, setStatus] = useState<string>('idle');
  useEffect(() => {
    let mounted = true;
    import('@/sync/syncService').then((m) =>
      m.onSyncStatusChange((newStatus) => {
        if (mounted) setStatus(newStatus);
      })
    );
    return () => { mounted = false; };
  }, []);
  if (status === 'idle') return null;
  const config: Record<string, { text: string; color: string }> = {
    syncing: { text: 'Syncing…', color: c.muted },
    synced: { text: 'Synced', color: c.green },
    offline: { text: 'Offline', color: c.muted },
    error: { text: 'Sync error', color: c.red },
  };
  const entry = config[status];
  if (!entry) return null;
  return <Text style={[styles.syncBadge, { color: entry.color }]}>{entry.text}</Text>;
}

export function Screen({ children, title, subtitle, action, back = false }: PropsWithChildren<{ title?: string; subtitle?: string; action?: ReactNode; back?: boolean }>) {
  const { colors: c } = useTheme();
  const styles = makeStyles(c);
  const insets = useSafeAreaInsets();
  const { isSignedIn, logout, user } = useAuth();
  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      router.replace('/login' as never);
    }
  };
  const initials = (user?.displayName || user?.businessName || '?').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  return <View style={[styles.screen, { paddingTop: insets.top }]}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><View style={styles.topbar}>{back ? <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()}><Text style={styles.back}>Back</Text></Pressable> : <View style={styles.brandRow}>{!back && isSignedIn ? <Pressable accessibilityRole="button" accessibilityLabel="Go to profile" onPress={() => router.push('/profile' as never)} style={styles.brandAvatar}>{user?.photoUri ? <Image source={{ uri: user.photoUri }} style={styles.brandAvatarImage} /> : <Text style={styles.brandAvatarText}>{initials}</Text>}</Pressable> : null}<Text style={styles.brand}>StockLite</Text></View>}<View style={styles.topbarRight}>{!back && isSignedIn ? <SyncBadge /> : null}{action || (!back && isSignedIn ? <Pressable accessibilityRole="button" onPress={handleLogout}><Text style={styles.link}>Log out</Text></Pressable> : null)}</View></View>{title ? <View style={styles.heading}><Text style={styles.title}>{title}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}</View> : null}{children}</ScrollView><BottomNavigation /></View>;
}

export function BottomNavigation() {
  const { colors: c } = useTheme();
  const styles = makeStyles(c);
  const items = [['Home', '/'], ['Products', '/products'], ['Sales', '/sales'], ['More', '/more']] as const;
  return <View style={styles.nav}>{items.map(([label, path]) => <Pressable key={path} accessibilityRole="button" accessibilityLabel={label} style={styles.navItem} onPress={() => router.replace(path as never)}><Text style={styles.navIcon}>{label === 'Home' ? 'H' : label === 'Products' ? 'P' : label === 'Sales' ? 'S' : '+'}</Text><Text style={styles.navLabel}>{label}</Text></Pressable>)}</View>;
}

export function PrimaryButton({ label, onPress, disabled = false, loading = false }: { label: string; onPress: () => void; disabled?: boolean; loading?: boolean }) {
  const { colors: c } = useTheme();
  const styles = makeStyles(c);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  return <Pressable
    accessibilityRole="button"
    disabled={disabled}
    onPress={onPress}
    onHoverIn={() => setHovered(true)}
    onHoverOut={() => setHovered(false)}
    onPressIn={() => setPressed(true)}
    onPressOut={() => setPressed(false)}
    style={[
      styles.primary,
      styles.primaryRow,
      disabled && styles.disabled,
      hovered && !disabled && styles.primaryHovered,
      pressed && !disabled && styles.primaryPressed,
    ]}
  >
    {loading ? <ActivityIndicator color={c.white} size="small" style={styles.primarySpinner} /> : null}
    <Text style={styles.primaryText}>{label}</Text>
  </Pressable>;
}

export function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors: c } = useTheme();
  const styles = makeStyles(c);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  return <Pressable
    onPress={onPress}
    onHoverIn={() => setHovered(true)}
    onHoverOut={() => setHovered(false)}
    onPressIn={() => setPressed(true)}
    onPressOut={() => setPressed(false)}
    style={[
      styles.secondary,
      hovered && styles.secondaryHovered,
      pressed && styles.secondaryPressed,
    ]}
  >
    <Text style={styles.secondaryText}>{label}</Text>
  </Pressable>;
}

export function ActionTile({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors: c } = useTheme();
  const styles = makeStyles(c);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  return <Pressable
    onPress={onPress}
    onHoverIn={() => setHovered(true)}
    onHoverOut={() => setHovered(false)}
    onPressIn={() => setPressed(true)}
    onPressOut={() => setPressed(false)}
    style={[styles.actionTile, hovered && styles.actionTileHovered, pressed && styles.actionTilePressed]}
  >
    <Text style={styles.actionTileText} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
  </Pressable>;
}

export function SectionHeader({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  const { colors: c } = useTheme();
  const styles = makeStyles(c);
  return <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text>{action && <Pressable onPress={onPress}><Text style={styles.link}>{action}</Text></Pressable>}</View>;
}

export function StatCard({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  const { colors: c } = useTheme();
  const styles = makeStyles(c);
  return <View style={[styles.stat, accent && styles.statAccent]}><Text style={[styles.statLabel, accent && styles.lightText]}>{label}</Text><Text style={[styles.statValue, accent && styles.lightText]}>{value}</Text></View>;
}

export function StatRow({ items }: { items: { label: string; value: string }[] }) {
  const { colors: c } = useTheme();
  const styles = makeStyles(c);
  return (
    <View style={styles.statRow}>
      {items.map((item, index) => (
        <View key={item.label} style={[styles.statRowItem, (index + 1) % 3 !== 0 && index !== items.length - 1 && styles.statRowDivider]}>
          <Text style={styles.statRowValue}>{item.value}</Text>
          <Text style={styles.statRowLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  const { colors: c } = useTheme();
  const styles = makeStyles(c);
  return <View style={styles.empty}><Text style={styles.emptyMark}>+</Text><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyText}>{text}</Text></View>;
}

export function Field({ label, error, ...props }: TextInputProps & { label: string; error?: string }) {
  const { colors: c } = useTheme();
  const styles = makeStyles(c);
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput accessibilityLabel={label} placeholderTextColor={c.muted} style={styles.input} {...props} />{error ? <Text style={styles.error}>{error}</Text> : null}</View>;
}

export async function pickImage(): Promise<string | null> {
  if (Platform.OS !== 'web') {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to add a picture.');
      return null;
    }
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.5,
    base64: true,
  });
  if (result.canceled || !result.assets?.[0]?.base64) return null;
  const mime = result.assets[0].mimeType || 'image/jpeg';
  return `data:${mime};base64,${result.assets[0].base64}`;
}

export async function takePhoto(): Promise<string | null> {
  if (Platform.OS !== 'web') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow camera access to take a picture.');
      return null;
    }
  }
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.5,
    base64: true,
  });
  if (result.canceled || !result.assets?.[0]?.base64) return null;
  const mime = result.assets[0].mimeType || 'image/jpeg';
  return `data:${mime};base64,${result.assets[0].base64}`;
}

export function PhotoPicker({ uri, onPick, size = 96, label = 'Add photo' }: { uri?: string | null; onPick: (uri: string | null) => void; size?: number; label?: string }) {
  const { colors: c } = useTheme();
  const styles = makeStyles(c);
  const handlePick = async () => {
    const result = await pickImage();
    if (result) onPick(result);
  };
  const handleCamera = async () => {
    const result = await takePhoto();
    if (result) onPick(result);
  };
  return (
    <View style={styles.photoPickerWrap}>
      <Pressable onPress={handlePick} style={[styles.photoCircle, { width: size, height: size, borderRadius: size / 2 }]}>
        {uri ? (
          <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
        ) : (
          <Text style={styles.photoPlaceholder}>+</Text>
        )}
      </Pressable>
      <View style={styles.photoActions}>
        <Pressable onPress={handlePick}><Text style={styles.link}>{uri ? 'Change photo' : label}</Text></Pressable>
        {Platform.OS !== 'web' ? <Pressable onPress={handleCamera}><Text style={styles.link}>Take photo</Text></Pressable> : null}
        {uri ? <Pressable onPress={() => onPick(null)}><Text style={[styles.link, { color: c.red }]}>Remove</Text></Pressable> : null}
      </View>
    </View>
  );
}

export function ProductRow({ product, onPress }: { product: Product; onPress?: () => void }) {
  const { colors: c } = useTheme();
  const styles = makeStyles(c);
  const low = product.quantity <= product.lowStockThreshold;
  return <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${product.name}`} onPress={onPress} style={styles.row}><View style={styles.rowThumbWrap}>{product.photoUri ? <Image source={{ uri: product.photoUri }} style={styles.rowThumb} /> : <View style={[styles.rowThumb, styles.rowThumbPlaceholder]} />}</View><View style={styles.rowMain}><Text style={styles.rowTitle}>{product.name}</Text><Text style={styles.rowMeta}>{formatNaira(product.sellingPrice)}</Text></View><View style={styles.rowRight}><Text style={styles.rowTitle}>{product.quantity}</Text><Text style={[styles.badge, low ? styles.badgeLow : styles.badgeGood]}>{low ? 'Low stock' : 'In stock'}</Text></View></Pressable>;
}

export function SaleRow({ sale, thumbUri, onPress }: { sale: Sale; thumbUri?: string; onPress?: () => void }) {
  const { colors: c } = useTheme();
  const styles = makeStyles(c);
  const itemCount = sale.items.length;
  const isSingleItem = itemCount === 1;
  return <Pressable accessibilityRole="button" accessibilityLabel="View sale details" onPress={onPress} style={styles.row}>
    <View style={styles.rowThumbWrap}>
      {isSingleItem && thumbUri ? (
        <Image source={{ uri: thumbUri }} style={styles.rowThumb} />
      ) : isSingleItem ? (
        <View style={[styles.rowThumb, styles.rowThumbPlaceholder]} />
      ) : (
        <View style={[styles.rowThumb, styles.rowThumbCount]}><Text style={styles.rowThumbCountText}>{itemCount}</Text></View>
      )}
    </View>
    <View style={styles.rowMain}>
      <Text style={styles.rowTitle}>{sale.items.map((item) => item.productName).join(', ')}</Text>
      <Text style={styles.rowMeta}>{sale.items.reduce((sum, item) => sum + item.quantity, 0)} item(s) · {new Date(sale.createdAt).toLocaleDateString('en-NG')}</Text>
    </View>
    <View style={styles.rowRight}>
      <Text style={styles.rowTitle}>{formatNaira(sale.total)}</Text>
      <Text style={styles.profit}>{formatNaira(sale.profit)} profit</Text>
    </View>
  </Pressable>;
}

export function ExpenseRow({ expense, onPress }: { expense: Expense; onPress?: () => void }) {
  const { colors: c } = useTheme();
  const styles = makeStyles(c);
  return <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${expense.title}`} onPress={onPress} style={styles.row}><View style={styles.rowMain}><Text style={styles.rowTitle}>{expense.title}</Text><Text style={styles.rowMeta}>{expense.category}</Text></View><Text style={styles.rowTitle}>{formatNaira(expense.amount)}</Text></Pressable>;
}

export function DebtRow({ debt, onPaid, onPress }: { debt: Debt; onPaid?: () => void; onPress?: () => void }) {
  const { colors: c } = useTheme();
  const styles = makeStyles(c);
  const isOverdue = debt.status === 'Outstanding' && new Date(debt.dueDate).getTime() < Date.now();
  const statusLabel = debt.status === 'Paid' ? 'Paid' : isOverdue ? 'Overdue' : 'Outstanding';
  const badgeStyle = debt.status === 'Paid' ? styles.badgeGood : isOverdue ? styles.badgeOverdue : styles.badgeLow;
  return <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${debt.customerName}`} onPress={onPress} style={styles.row}>
    <View style={styles.rowMain}>
      <Text style={styles.rowTitle}>{debt.customerName}</Text>
      <Text style={styles.rowMeta}>{debt.description} · Due {new Date(debt.dueDate).toLocaleDateString('en-NG')}</Text>
    </View>
    <View style={styles.rowRight}>
      <Text style={styles.rowTitle}>{formatNaira(debt.amount)}</Text>
      <Pressable onPress={onPaid}><Text style={[styles.badge, badgeStyle]}>{statusLabel}</Text></Pressable>
    </View>
  </Pressable>;
}