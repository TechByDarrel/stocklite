import { StyleSheet, Text, View } from 'react-native';
import { Screen, useTheme } from '@/components/stock-ui';

const sections = [
  { h: 'Overview', b: 'StockLite helps small businesses track inventory, sales, expenses and debts. This policy explains what information the app handles and why.' },
  { h: 'Information we handle', b: 'Account details: your email, business name, display name and an optional profile photo.\n\nBusiness records you enter: products, prices, stock levels, sales, expenses, debts (including customer names you type in) and optional product photos.' },
  { h: 'Where your data is stored', b: 'Your records are saved on your device first. When you are online and signed in, StockLite also backs them up to Google Firebase under your account. Access rules are set so each account can only reach its own data.' },
  { h: 'Passwords, PIN and biometrics', b: 'Your password and PIN are stored on your device as salted hashes, not as plain text. Firebase Authentication handles your sign-in credentials for cloud backup. Fingerprint and face unlock are handled by your phone. StockLite never receives or stores your biometric data.' },
  { h: 'Permissions', b: 'Camera and photo library: used only when you choose to add a product or profile picture.\n\nInternet: used to back up your records when you are online.' },
  { h: 'What we do not do', b: 'StockLite does not show ads and does not sell or rent your personal information.' },
  { h: 'Your choices', b: 'You can export all your records from Profile > Export my data. To request deletion of your account and cloud data, contact support through Help & FAQ.' },
  { h: 'Children', b: 'StockLite is built for business use and is not directed at children.' },
  { h: 'Changes and contact', b: 'We may update this policy as StockLite grows. Questions? Reach us through Help & FAQ.' },
];

export default function PrivacyScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return (
    <Screen title="Privacy policy" subtitle="Last updated: October 2026" back>
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