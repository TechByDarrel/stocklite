import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useStockLite } from '@/context/StockLiteContext';
import { colors, EmptyState, PrimaryButton, SaleRow, Screen, SectionHeader, StatCard } from '@/components/stock-ui';
import { formatNaira } from '@/utils/currency';

const today = (value: string) => new Date(value).toDateString() === new Date().toDateString();

export default function SalesScreen() {
  const { sales, products } = useStockLite();
  const [query, setQuery] = useState('');

  const recent = sales.filter((sale) => today(sale.createdAt));
  const revenue = recent.reduce((sum, sale) => sum + sale.total, 0);
  const profit = recent.reduce((sum, sale) => sum + sale.profit, 0);

  const filtered = sales.filter((sale) =>
    sale.items.some((item) => item.productName.toLowerCase().includes(query.trim().toLowerCase()))
  );

  const thumbFor = (sale: (typeof sales)[number]) => {
    const firstItem = sale.items[0];
    if (!firstItem) return undefined;
    return products.find((p) => p.id === firstItem.productId)?.photoUri;
  };

  return (
    <Screen title="Sales" subtitle="Keep track of every sale">
      <View style={styles.stats}>
        <StatCard label="Sales today" value={String(recent.length)} accent />
        <StatCard label="Revenue" value={formatNaira(revenue)} />
        <StatCard label="Profit" value={formatNaira(profit)} />
      </View>
      <PrimaryButton label="+ Record Sale" onPress={() => router.push('/record-sale')} />
      <SectionHeader title="Recent sales" />
      {sales.length > 5 ? (
        <TextInput
          accessibilityLabel="Search sales by product"
          value={query}
          onChangeText={setQuery}
          placeholder="Search sales by product"
          placeholderTextColor="#9aa59d"
          style={styles.search}
        />
      ) : null}
      {filtered.length ? (
        filtered.map((sale) => <SaleRow key={sale.id} sale={sale} thumbUri={thumbFor(sale)} onPress={() => router.push(`/sale-detail?id=${sale.id}` as never)} />)
      ) : (
        <EmptyState
          title={sales.length === 0 ? 'No sales recorded' : 'No matching sales'}
          text={sales.length === 0 ? 'Record a sale to start building your sales history.' : 'Try a different search term.'}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  search: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 13, fontSize: 16, color: colors.ink, marginTop: 14, marginBottom: 4 },
});