import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen, useTheme } from '@/components/stock-ui';

const links = [
  ['Expenses', 'Track the running costs of your shop', '/expenses'],
  ['Debts', 'Keep customer balances in view', '/debts'],
  ['Profit', 'Understand revenue, costs, and profit', '/profit'],
  ['Profile', 'Manage your account and business details', '/profile'],
] as const;

export default function MoreScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return <Screen title="More" subtitle="Business tools and account settings">
    <View style={styles.list}>{links.map(([title, description, path]) => <Pressable key={path} accessibilityRole="button" style={styles.item} onPress={() => router.push(path as never)}><View style={styles.copy}><Text style={styles.title}>{title}</Text><Text style={styles.description}>{description}</Text></View><Text style={styles.chevron}>›</Text></Pressable>)}</View>
  </Screen>;
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    list: { gap: 8 },
    item: { minHeight: 68, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    copy: { flex: 1 },
    title: { color: colors.ink, fontWeight: '800', fontSize: 16 },
    description: { color: colors.muted, fontSize: 13, marginTop: 4 },
    chevron: { color: colors.green, fontSize: 24, marginLeft: 12 },
  });
}
