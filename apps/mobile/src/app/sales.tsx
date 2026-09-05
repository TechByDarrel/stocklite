import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useStockLite } from '@/context/StockLiteContext';
import { colors, EmptyState, PrimaryButton, SaleRow, Screen, SectionHeader, StatCard } from '@/components/stock-ui';
import { formatNaira } from '@/utils/currency';
const today = (value: string) => new Date(value).toDateString() === new Date().toDateString();
export default function SalesScreen() {
  const { sales } = useStockLite();
  const recent = sales.filter((sale) => today(sale.createdAt));
  const revenue = recent.reduce((sum, sale) => sum + sale.total, 0);
  const profit = recent.reduce((sum, sale) => sum + sale.profit, 0);
  return <Screen title="Sales" subtitle="Keep track of every sale">
    <View style={styles.stats}>
      <StatCard label="Sales today" value={String(recent.length)} accent />
      <StatCard label="Revenue" value={formatNaira(revenue)} />
      <StatCard label="Profit" value={formatNaira(profit)} />
    </View>
    <PrimaryButton label="+ Record Sale" onPress={() => router.push('/record-sale')} />
    <SectionHeader title="Recent sales" />
    {sales.length ? sales.map((sale) => <SaleRow key={sale.id} sale={sale} onPress={() => router.push(`/sale-detail?id=${sale.id}` as never)} />) : <EmptyState title="No sales recorded" text="Record a sale to start building your sales history." />}
  </Screen>;
}
const styles = StyleSheet.create({ stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 } });