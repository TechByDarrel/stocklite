import { router } from 'expo-router';
import { PropsWithChildren, ReactNode, useState } from 'react';
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { formatNaira } from '@/utils/currency';
import type { Debt, Expense, Product, Sale } from '@/types';
import { useAuth } from '@/context/AuthContext';

export const colors = { ink: '#1A2E22', muted: '#8B8172', line: '#E8E1D3', paper: '#F7F4EC', white: '#FFFFFF', green: '#2D5C3E', mint: '#E4EBE0', yellow: '#EFD9A8', red: '#C9622D' };

export function Screen({ children, title, subtitle, action, back = false }: PropsWithChildren<{ title?: string; subtitle?: string; action?: ReactNode; back?: boolean }>) {
  const { isSignedIn, logout } = useAuth();
  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      router.replace('/login' as never);
    }
  };
  return <View style={styles.screen}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><View style={styles.topbar}>{back ? <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()}><Text style={styles.back}>Back</Text></Pressable> : <Text style={styles.brand}>StockLite</Text>}{action || (!back && isSignedIn ? <Pressable accessibilityRole="button" onPress={handleLogout}><Text style={styles.link}>Log out</Text></Pressable> : null)}</View>{title ? <View style={styles.heading}><Text style={styles.title}>{title}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}</View> : null}{children}</ScrollView><BottomNavigation /></View>;
}

export function BottomNavigation() {
  const items = [['Home', '/'], ['Products', '/products'], ['Sales', '/sales'], ['More', '/more']] as const;
  return <View style={styles.nav}>{items.map(([label, path]) => <Pressable key={path} accessibilityRole="button" accessibilityLabel={label} style={styles.navItem} onPress={() => router.replace(path as never)}><Text style={styles.navIcon}>{label === 'Home' ? 'H' : label === 'Products' ? 'P' : label === 'Sales' ? 'S' : '+'}</Text><Text style={styles.navLabel}>{label}</Text></Pressable>)}</View>;
}

export function PrimaryButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
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
      disabled && styles.disabled,
      hovered && !disabled && styles.primaryHovered,
      pressed && !disabled && styles.primaryPressed,
    ]}
  >
    <Text style={styles.primaryText}>{label}</Text>
  </Pressable>;
}

export function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
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

export function SectionHeader({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) { return <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text>{action && <Pressable onPress={onPress}><Text style={styles.link}>{action}</Text></Pressable>}</View>; }
export function StatCard({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) { return <View style={[styles.stat, accent && styles.statAccent]}><Text style={[styles.statLabel, accent && styles.lightText]}>{label}</Text><Text style={[styles.statValue, accent && styles.lightText]}>{value}</Text></View>; }
export function EmptyState({ title, text }: { title: string; text: string }) { return <View style={styles.empty}><Text style={styles.emptyMark}>+</Text><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyText}>{text}</Text></View>; }
export function Field({ label, error, ...props }: TextInputProps & { label: string; error?: string }) { return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput accessibilityLabel={label} placeholderTextColor="#9aa59d" style={styles.input} {...props} />{error ? <Text style={styles.error}>{error}</Text> : null}</View>; }

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
        {uri ? <Pressable onPress={() => onPick(null)}><Text style={[styles.link, { color: colors.red }]}>Remove</Text></Pressable> : null}
      </View>
    </View>
  );
}

export function ProductRow({ product, onPress }: { product: Product; onPress?: () => void }) { const low = product.quantity <= product.lowStockThreshold; return <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${product.name}`} onPress={onPress} style={styles.row}><View style={styles.rowThumbWrap}>{product.photoUri ? <Image source={{ uri: product.photoUri }} style={styles.rowThumb} /> : <View style={[styles.rowThumb, styles.rowThumbPlaceholder]} />}</View><View style={styles.rowMain}><Text style={styles.rowTitle}>{product.name}</Text><Text style={styles.rowMeta}>{formatNaira(product.sellingPrice)}</Text></View><View style={styles.rowRight}><Text style={styles.rowTitle}>{product.quantity}</Text><Text style={[styles.badge, low ? styles.badgeLow : styles.badgeGood]}>{low ? 'Low stock' : 'In stock'}</Text></View></Pressable>; }
export function SaleRow({ sale, onPress }: { sale: Sale; onPress?: () => void }) { return <Pressable accessibilityRole="button" accessibilityLabel="View sale details" onPress={onPress} style={styles.row}><View style={styles.rowMain}><Text style={styles.rowTitle}>{sale.items.map((item) => item.productName).join(', ')}</Text><Text style={styles.rowMeta}>{sale.items.reduce((sum, item) => sum + item.quantity, 0)} item(s) · {new Date(sale.createdAt).toLocaleDateString('en-NG')}</Text></View><View style={styles.rowRight}><Text style={styles.rowTitle}>{formatNaira(sale.total)}</Text><Text style={styles.profit}>{formatNaira(sale.profit)} profit</Text></View></Pressable>; }
export function ExpenseRow({ expense, onPress }: { expense: Expense; onPress?: () => void }) { return <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${expense.title}`} onPress={onPress} style={styles.row}><View style={styles.rowMain}><Text style={styles.rowTitle}>{expense.title}</Text><Text style={styles.rowMeta}>{expense.category}</Text></View><Text style={styles.rowTitle}>{formatNaira(expense.amount)}</Text></Pressable>; }
export function DebtRow({ debt, onPaid, onPress }: { debt: Debt; onPaid?: () => void; onPress?: () => void }) { return <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${debt.customerName}`} onPress={onPress} style={styles.row}><View style={styles.rowMain}><Text style={styles.rowTitle}>{debt.customerName}</Text><Text style={styles.rowMeta}>{debt.description} · Due {new Date(debt.dueDate).toLocaleDateString('en-NG')}</Text></View><View style={styles.rowRight}><Text style={styles.rowTitle}>{formatNaira(debt.amount)}</Text><Pressable onPress={onPaid}><Text style={[styles.badge, debt.status === 'Paid' ? styles.badgeGood : styles.badgeLow]}>{debt.status}</Text></Pressable></View></Pressable>; }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { width: '100%', maxWidth: 980, alignSelf: 'center', padding: 20, paddingBottom: 110 },
  topbar: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { color: colors.green, fontWeight: '800', fontSize: 18 },
  back: { color: colors.green, fontSize: 16, fontWeight: '700' },
  heading: { marginTop: 20, marginBottom: 22 },
  title: { color: colors.ink, fontSize: 30, fontWeight: '800' },
  subtitle: { color: colors.muted, marginTop: 6, fontSize: 15 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 12 },
  sectionTitle: { color: colors.ink, fontSize: 19, fontWeight: '800' },
  link: { color: colors.green, fontWeight: '700' },
  stat: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 17, borderRadius: 10, minWidth: 140, flex: 1 },
  statAccent: { backgroundColor: colors.green, borderColor: colors.green },
  statLabel: { color: colors.muted, fontSize: 13, marginBottom: 9 },
  statValue: { color: colors.ink, fontSize: 22, fontWeight: '800' },
  lightText: { color: colors.white },
  primary: { backgroundColor: colors.green, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 8, transitionProperty: 'transform, background-color, box-shadow', transitionDuration: '150ms' } as any,
  primaryHovered: { backgroundColor: '#254a32', transform: [{ translateY: -1 }], boxShadow: '0 4px 10px rgba(26,46,34,0.18)' } as any,
  primaryPressed: { transform: [{ translateY: 0 }], backgroundColor: '#1f3f2a' } as any,
  primaryText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  secondary: { backgroundColor: colors.mint, borderRadius: 8, paddingVertical: 13, alignItems: 'center', marginTop: 8, transitionProperty: 'transform, background-color', transitionDuration: '150ms' } as any,
  secondaryHovered: { backgroundColor: '#d8e2d2', transform: [{ translateY: -1 }] } as any,
  secondaryPressed: { transform: [{ translateY: 0 }] } as any,
  secondaryText: { color: colors.green, fontWeight: '800' },
  disabled: { opacity: 0.45 },
  empty: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, borderRadius: 10, padding: 28, alignItems: 'center' },
  emptyMark: { color: colors.green, fontSize: 28, fontWeight: '300' },
  emptyTitle: { color: colors.ink, fontWeight: '800', fontSize: 16, marginTop: 8 },
  emptyText: { color: colors.muted, textAlign: 'center', marginTop: 5, lineHeight: 20 },
  row: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  rowThumbWrap: { marginRight: 2 },
  rowThumb: { width: 40, height: 40, borderRadius: 8 },
  rowThumbPlaceholder: { backgroundColor: colors.mint },
  rowMain: { flex: 1 },
  rowRight: { alignItems: 'flex-end' },
  rowTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  rowMeta: { color: colors.muted, fontSize: 13, marginTop: 5 },
  profit: { color: colors.green, fontSize: 12, marginTop: 5, fontWeight: '700' },
  badge: { fontSize: 12, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5, overflow: 'hidden', marginTop: 5 },
  badgeLow: { color: colors.red, backgroundColor: '#f3e3d6' },
  badgeGood: { color: colors.green, backgroundColor: colors.mint },
  field: { marginBottom: 14 },
  fieldLabel: { color: colors.ink, fontWeight: '700', marginBottom: 7 },
  input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, color: colors.ink, fontSize: 16 },
  error: { color: colors.red, fontSize: 12, marginTop: 5 },
  photoPickerWrap: { alignItems: 'center', marginBottom: 18, gap: 8 },
  photoCircle: { backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
  photoPlaceholder: { color: colors.green, fontSize: 28, fontWeight: '300' },
  photoActions: { flexDirection: 'row', gap: 16 },
  nav: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.line, flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8, paddingBottom: 12 },
  navItem: { alignItems: 'center', minWidth: 46 },
  navIcon: { color: colors.green, fontSize: 18, fontWeight: '800' },
  navLabel: { color: colors.muted, fontSize: 10, marginTop: 3 },
});