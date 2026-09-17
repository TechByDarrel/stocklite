import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useStockLite } from '@/context/StockLiteContext';
import { useAuth } from '@/context/AuthContext';
import { ActionTile, colors, EmptyState, ProductRow, SaleRow, Screen, SectionHeader, StatCard, StatRow } from '@/components/stock-ui';
import { formatNaira } from '@/utils/currency';
import { getTimeBasedGreeting } from '@/utils/greeting';
const isToday = (value: string) => new Date(value).toDateString() === new Date().toDateString();

function useFadeSlide(delay: number) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 350, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return { opacity, transform: [{ translateY }] };
}

export default function HomeScreen() {
    const { products, sales, debts, expenses, isLoading } = useStockLite();
  const { user } = useAuth();

  const heroAnim = useFadeSlide(0);
  const statAnim = useFadeSlide(80);
  const rowAnim = useFadeSlide(140);
  const actionsAnim = useFadeSlide(200);

  const todaySales = sales.filter((sale) => isToday(sale.createdAt));
  const lowStock = products
    .filter((product) => product.quantity <= product.lowStockThreshold)
    .sort((a, b) => a.quantity - b.quantity);
  const revenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  const profit = todaySales.reduce((sum, sale) => sum + sale.profit, 0);
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
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
      <Animated.View style={heroAnim}>
        <View style={styles.hero}>
          <Text style={styles.greeting}>
            {getTimeBasedGreeting()}, {user?.businessName || 'there'}
          </Text>
          <Text style={styles.heroTitle}>Your business at a glance.</Text>
          <Text style={styles.heroSub}>See today's movement and the next useful action.</Text>
        </View>
      </Animated.View>

      <Animated.View style={statAnim}>
        <StatCard label="Today's sales" value={formatNaira(revenue)} accent />
      </Animated.View>

      <Animated.View style={rowAnim}>
              <StatRow
        items={[
          { label: "Today's profit", value: formatNaira(profit) },
          { label: 'Total revenue', value: formatNaira(totalRevenue) },
          { label: 'Products', value: String(products.length) },
          { label: 'Low stock', value: String(lowStock.length) },
          { label: 'Debts owed', value: formatNaira(debtTotal) },
          { label: 'Expenses', value: formatNaira(expenses.reduce((sum, e) => sum + e.amount, 0)) },
        ]}
      />
      </Animated.View>

      <Animated.View style={actionsAnim}>
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
      </Animated.View>

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
    marginBottom: 14,
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
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
});