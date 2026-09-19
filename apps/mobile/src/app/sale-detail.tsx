import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Screen, useTheme } from '@/components/stock-ui';
import { useStockLite } from '@/context/StockLiteContext';
import { formatNaira } from '@/utils/currency';

export default function SaleDetailScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sales } = useStockLite();
  const sale = sales.find((s) => s.id === id);

  if (!sale) {
    return (
      <Screen title="Sale not found" back>
        <Text style={styles.error}>This sale could not be found.</Text>
      </Screen>
    );
  }

  return (
    <Screen title="Sale details" subtitle={new Date(sale.createdAt).toLocaleString('en-NG')} back>
      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryValue}>{formatNaira(sale.total)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Profit</Text>
          <Text style={styles.summaryValueGreen}>{formatNaira(sale.profit)}</Text>
        </View>
      </View>
      <Text style={styles.sectionLabel}>Items</Text>
      {sale.items.map((item, index) => (
        <View key={`${item.productId}-${index}`} style={styles.itemRow}>
          <View style={styles.itemMain}>
            <Text style={styles.itemName}>{item.productName}</Text>
            <Text style={styles.itemMeta}>{item.quantity} × {formatNaira(item.unitPrice)}</Text>
          </View>
          <Text style={styles.itemTotal}>{formatNaira(item.unitPrice * item.quantity)}</Text>
        </View>
      ))}
    </Screen>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    error: { color: colors.red },
    summary: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 10, padding: 16, marginBottom: 20 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    summaryLabel: { color: colors.muted, fontSize: 14 },
    summaryValue: { color: colors.ink, fontWeight: '800', fontSize: 16 },
    summaryValueGreen: { color: colors.green, fontWeight: '800', fontSize: 16 },
    sectionLabel: { color: colors.ink, fontWeight: '800', fontSize: 16, marginBottom: 10 },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
    itemMain: { flex: 1 },
    itemName: { color: colors.ink, fontWeight: '700', fontSize: 15 },
    itemMeta: { color: colors.muted, fontSize: 13, marginTop: 3 },
    itemTotal: { color: colors.ink, fontWeight: '800', fontSize: 15 },
  });
}
