import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useStockLite } from '@/context/StockLiteContext';
import { useAuth } from '@/context/AuthContext';
import { ActionTile, colors, EmptyState, ProductRow, SaleRow, Screen, SectionHeader, StatCard } from '@/components/stock-ui';
import { formatNaira } from '@/utils/currency';
import { getTimeBasedGreeting } from '@/utils/greeting';
const isToday = (value: string) => new Date(value).toDateString() === new Date().toDateString();

export default function HomeScreen() {
  const { products, sales, debts, isLoading } = useStockLite();
  const { user } = useAuth();

  const todaySales = sales.filter((sale) => isToday(sale.createdAt));
  const lowStock = products
    .filter((product) => product.quantity <= product.lowStockThreshold)
    .sort((a, b) => a.quantity - b.quantity);
  const revenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  const profit = todaySales.reduce((sum, sale) => sum + sale.profit, 0);
  const debtTotal = debts.filter((debt) => debt.status === 'Outstanding').reduce((sum, debt) => sum + debt.amount, 0);

  const thumbFor = (sale: (typeof sales)[number]) => {
    const firstItem = sale.items[0];
    if (!firstItem) return undefined;
    return products.find((p) => p.id === firstItem.productId)?.photoUri;
  };

  if (isLoading) {
    return (
      <Screen>
        <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 20 }}>Loading...</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.greeting}>
          {getTimeBasedGreeting()}, {user?.businessName || 'there'}
        </Text>
        <Text style={styles.heroTitle}>Your business at a glance.</Text>
        <Text style={styles.heroSub}>See today's movement and the next useful action.</Text>
      </View>

      <View style={styles.grid}>
        <StatCard label="Today's sales" value={formatNaira(revenue)} accent />
        <StatCard label="Today's profit" value={formatNaira(profit)} />
        <StatCard label="Total revenue" value={formatNaira(sales.reduce((sum, sale) => sum + sale.total, 0))} />
        <StatCard label="Products" value={String(products.length)} />
        <StatCard label="Low stock" value={String(lowStock.length)} />
        <StatCard label="Outstanding debts" value={formatNaira(debtTotal)} />
      </View>

      <SectionHeader title="Quick actions" />
      <View style={styles.actionGrid}>
        {[
          ['Record sale', '/record-sale'],
          ['Add product', '/add-product'],
          ['Add expense', '/add-expense'],
          ['Add debt', '/add-debt'],
        ].map(([label, path]) => (
          <ActionTile key={path} label={label} onPress={() => router.push(path as never)} />
        ))}
      </View>

      <SectionHeader title="Recent sales" action="View all" onPress={() => router.push('/sales')} />
      {sales.length ? (
        sales.slice(0, 3).map((sale) => <SaleRow key={sale.id} sale={sale} thumbUri={thumbFor(sale)} onPress={() => router.push(`/sale-detail?id=${sale.id}` as never)} />)
      ) : (
        <EmptyState title="No sales yet" text="Record your first sale to see it here." />
      )}

      <SectionHeader title="Low stock" action="View products" onPress={() => router.push('/products')} />
      {lowStock.length ? (
        lowStock.slice(0, 3).map((product) => <ProductRow key={product.id} product={product} onPress={() => router.push(`/edit-product?id=${product.id}` as never)} />)
      ) : (
        <EmptyState title="Stock levels look good" text="All products have sufficient stock." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.ink,
    padding: 24,
    borderRadius: 12,
    marginTop: 12,
  },
  greeting: {
    color: '#b8d4c1',
    fontSize: 15,
    fontWeight: '700',
  },
  heroTitle: {
    color: colors.white,
    fontSize: 27,
    fontWeight: '800',
    marginTop: 9,
  },
  heroSub: {
    color: '#d0ddd3',
    marginTop: 8,
    lineHeight: 21,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});