import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, Screen, useTheme } from '@/components/stock-ui';

const SUPPORT_URL = 'https://wa.me/2348060802595?text=Hi%20StockLite%20support%2C%20I%20need%20help%20with%20';

const faqs = [
  { q: 'Does StockLite work without internet?', a: 'Yes. Your records are saved on your device first, so you can keep working offline. When you are online, StockLite also backs your records up to the cloud.' },
  { q: 'How do I record a sale?', a: 'Tap "Record sale" on the Home screen, search for a product, set the quantity, tap "Add item", then "Complete Sale". Stock and profit update automatically.' },
  { q: 'Why can I not sell more than I have in stock?', a: 'StockLite stops a sale from taking stock below zero so your numbers stay correct. Update the product quantity first if you have received new stock.' },
  { q: 'How do I edit or delete a product, expense or debt?', a: 'Tap the item in its list. You can change the details and save, or delete it from the same screen.' },
  { q: 'What does "Overdue" mean on a debt?', a: 'A debt is overdue when its due date has passed and it has not been marked as paid. Overdue debts are shown first so you know who to follow up with.' },
  { q: 'How do I turn on fingerprint or PIN login?', a: 'Go to Profile. Use "Biometric login" if your phone supports it, and "PIN login" to set a 4-digit PIN. When either is on, StockLite locks after 30 seconds in the background.' },
  { q: 'I forgot my password. What can I do?', a: 'Password reset is not available yet. If you set a PIN or biometric login, use that to get in. Please contact support and we will help. Keep a backup with "Export my data" in Profile.' },
  { q: 'How do I back up my data?', a: 'Go to Profile and tap "Export my data". It saves all your products, sales, expenses and debts into one backup file.' },
];

export default function HelpScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <Screen title="Help & FAQ" subtitle="Quick answers to common questions" back>
      <View style={styles.list}>
        {faqs.map((item, index) => {
          const open = openIndex === index;
          return (
            <Pressable
              key={item.q}
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
              onPress={() => setOpenIndex(open ? null : index)}
              style={styles.item}
            >
              <View style={styles.row}>
                <Text style={styles.question}>{item.q}</Text>
                <Text style={styles.toggle}>{open ? '–' : '+'}</Text>
              </View>
              {open ? <Text style={styles.answer}>{item.a}</Text> : null}
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.lead}>Still stuck? We would love to help.</Text>
      <PrimaryButton label="Chat with support on WhatsApp" onPress={() => Linking.openURL(SUPPORT_URL)} />
    </Screen>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    list: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 8, overflow: 'hidden' },
    item: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.line },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
    question: { flex: 1, color: colors.ink, fontWeight: '700', fontSize: 15 },
    toggle: { color: colors.green, fontSize: 22, fontWeight: '700' },
    answer: { color: colors.muted, marginTop: 10, lineHeight: 21, fontSize: 14 },
    lead: { color: colors.muted, textAlign: 'center', marginTop: 24, marginBottom: 4 },
  });
}