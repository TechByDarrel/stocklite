import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useStockLite } from '@/context/StockLiteContext';
import { EmptyState, PrimaryButton, ProductRow, Screen, useTheme } from '@/components/stock-ui';

type SortOption = 'name' | 'stockLow' | 'stockHigh' | 'priceLow' | 'priceHigh';

const sortOptions: { key: SortOption; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'stockLow', label: 'Stock: Low first' },
  { key: 'stockHigh', label: 'Stock: High first' },
  { key: 'priceLow', label: 'Price: Low first' },
  { key: 'priceHigh', label: 'Price: High first' },
];

export default function ProductsScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { products } = useStockLite();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortOption>('name');

  const filtered = products.filter((product) => product.name.toLowerCase().includes(query.trim().toLowerCase()));

  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case 'stockLow': return a.quantity - b.quantity;
      case 'stockHigh': return b.quantity - a.quantity;
      case 'priceLow': return a.sellingPrice - b.sellingPrice;
      case 'priceHigh': return b.sellingPrice - a.sellingPrice;
      case 'name':
      default: return a.name.localeCompare(b.name);
    }
  });

  const emptyTitle = products.length === 0 ? 'Your inventory is empty' : 'No matching products';
  const emptyText = products.length === 0 ? 'Add your first product to start tracking stock.' : 'Try a different search term.';

  return (
    <Screen
      title="Products"
      subtitle={`${products.length} ${products.length === 1 ? 'product' : 'products'} in your shop`}
      action={<Pressable accessibilityRole="button" onPress={() => router.push('/add-product')} style={styles.add}><Text style={styles.addText}>Add product</Text></Pressable>}
    >
      <TextInput accessibilityLabel="Search products" value={query} onChangeText={setQuery} placeholder="Search products" placeholderTextColor={colors.muted} style={styles.search} />
      {products.length > 1 ? (
        <View style={styles.sortRow}>
          {sortOptions.map((option) => (
            <Pressable key={option.key} onPress={() => setSort(option.key)} style={[styles.sortChip, sort === option.key && styles.sortChipActive]}>
              <Text style={sort === option.key ? styles.sortChipTextActive : styles.sortChipText}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {sorted.length ? sorted.map((product) => <ProductRow key={product.id} product={product} onPress={() => router.push(`/edit-product?id=${product.id}` as never)} />) : <EmptyState title={emptyTitle} text={emptyText} />}
    </Screen>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    add: { backgroundColor: colors.green, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 7 },
    addText: { color: colors.white, fontSize: 12, fontWeight: '800' },
    search: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 13, fontSize: 16, color: colors.ink, marginBottom: 10 },
    sortRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
    sortChip: { borderWidth: 1, borderColor: colors.line, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 16, backgroundColor: colors.white },
    sortChipActive: { backgroundColor: colors.green, borderColor: colors.green },
    sortChipText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
    sortChipTextActive: { color: colors.white, fontSize: 12, fontWeight: '700' },
  });
}
