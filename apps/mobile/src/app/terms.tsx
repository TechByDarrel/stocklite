import { StyleSheet, Text, View } from 'react-native';
import { Screen, useTheme } from '@/components/stock-ui';

const sections = [
  { h: 'Using StockLite', b: 'StockLite is currently in beta. It is provided as is, and features may change as we improve it.' },
  { h: 'Your account', b: 'You are responsible for keeping your password, PIN and device secure, and for the accuracy of the records you enter.' },
  { h: 'Your data and backups', b: 'Your records belong to you. We back them up to the cloud when you are online, but you should also keep your own copies using Profile > Export my data.' },
  { h: 'Not professional advice', b: 'StockLite is a record-keeping tool. It does not provide accounting, tax or financial advice.' },
  { h: 'Acceptable use', b: 'Please do not misuse the app, try to access other users\' data, or use it for anything unlawful.' },
  { h: 'No warranty', b: 'We work hard to keep StockLite reliable, but we cannot guarantee it will always be error-free or uninterrupted. To the extent allowed by law, we are not liable for losses arising from use of the app.' },
  { h: 'Changes and contact', b: 'We may update these terms as StockLite grows. Questions? Reach us through Help & FAQ.' },
];

export default function TermsScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return (
    <Screen title="Terms of use" subtitle="Last updated: October 2026" back>
      {sections.map((s) => (
        <View key={s.h} style={styles.section}>
          <Text style={styles.heading}>{s.h}</Text>
          <Text style={styles.body}>{s.b}</Text>
        </View>
      ))}
    </Screen>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    section: { marginBottom: 20 },
    heading: { color: colors.ink, fontWeight: '800', fontSize: 16, marginBottom: 6 },
    body: { color: colors.muted, lineHeight: 22, fontSize: 14 },
  });
}