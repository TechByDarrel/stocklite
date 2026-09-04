import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Field, PrimaryButton, Screen } from '@/components/stock-ui';
import { useStockLite } from '@/context/StockLiteContext';
import type { SaleItem } from '@/types';
import { formatNaira } from '@/utils/currency';

export default function RecordSaleScreen() {
  const { products, recordSale } = useStockLite();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [items, setItems] = useState<SaleItem[]>([]);
  const [error, setError] = useState('');
  const selected = products.find((product) => product.id === selectedId);

  const addItem = () => {
    const count = Number(quantity);
    if (!selected) return setError('Select a product first.');
    if (!Number.isInteger(count) || count < 1 || count > selected.quantity) {
      return setError(`Quantity must be between 1 and ${selected.quantity}.`);
    }

    const existingQuantity = items.find((item) => item.productId === selected.id)?.quantity ?? 0;
    if (existingQuantity + count > selected.quantity) {
      return setError(`Only ${selected.quantity - existingQuantity} more available.`);
    }
    setItems((current) => {
      const existing = current.find((item) => item.productId === selected.id);
      if (existing) return current.map((item) => item.productId === selected.id ? { ...item, quantity: item.quantity + count } : item);
      return [...current, {
        productId: selected.id,
        productName: selected.name,
        quantity: count,
        unitPrice: selected.sellingPrice,
        unitCost: selected.costPrice,
      }];
    });
    setError('');
    setSelectedId('');
    setQuery('');
    setQuantity('1');
  };

  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const profit = items.reduce(
    (sum, item) => sum + (item.unitPrice - item.unitCost) * item.quantity,
    0,
  );

  const complete = async () => {
    if (!items.length) {
      setError('Add at least one item.');
      return;
    }

    try {
      await recordSale(items);
      router.back();
    } catch {
      setError('Could not record this sale. Please check stock and try again.');
    }
  };

  const matches = query
    ? products
        .filter(
          (product) =>
            product.quantity > 0 &&
            product.name.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, 4)
    : [];

  return (
    <Screen title="Record sale" subtitle="Add products sold to a customer" back>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search products..."
        placeholderTextColor="#9aa59d"
        style={styles.search}
      />

      {matches.map((product) => (
        <Pressable
          key={product.id}
          style={styles.option}
          onPress={() => {
            setSelectedId(product.id);
            setQuery(product.name);
          }}
        >
          <Text style={styles.optionName}>{product.name}</Text>
          <Text style={styles.optionPrice}>
            {formatNaira(product.sellingPrice)} · {product.quantity} available
          </Text>
        </Pressable>
      ))}

      <Field
        label={selected ? `Quantity for ${selected.name}` : 'Quantity'}
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
      />

      <Pressable style={styles.add} onPress={addItem}>
        <Text style={styles.addText}>Add item</Text>
      </Pressable>

      {items.map((item, index) => (
        <View key={`${item.productId}-${index}`} style={styles.item}>
          <Text style={styles.itemName}>
            {item.productName} x {item.quantity}
          </Text>
          <Text style={styles.itemValue}>
            {formatNaira(item.unitPrice * item.quantity)}
          </Text>
        </View>
      ))}

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Sale summary</Text>
        <Text>
          Subtotal <Text style={styles.value}>{formatNaira(total)}</Text>
        </Text>
        <Text>
          Profit <Text style={styles.value}>{formatNaira(profit)}</Text>
        </Text>
        <Text style={styles.total}>
          Total <Text style={styles.value}>{formatNaira(total)}</Text>
        </Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Complete Sale" onPress={complete} disabled={!items.length} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dfe6df',
    borderRadius: 8,
    padding: 13,
    fontSize: 16,
    color: '#16221c',
  },
  option: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#dfe6df',
    backgroundColor: '#fff',
  },
  optionName: { fontWeight: '800', color: '#16221c' },
  optionPrice: { color: '#6b776f', marginTop: 3, fontSize: 12 },
  add: {
    backgroundColor: '#dcefe4',
    padding: 13,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  addText: { color: '#176b45', fontWeight: '800' },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#dfe6df',
  },
  itemName: { color: '#16221c', fontWeight: '700' },
  itemValue: { color: '#176b45', fontWeight: '700' },
  summary: { padding: 16, backgroundColor: '#fff', marginTop: 20, gap: 10 },
  summaryTitle: { color: '#16221c', fontWeight: '800', fontSize: 16 },
  value: { fontWeight: '700' },
  total: {
    fontWeight: '800',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#dfe6df',
  },
  error: { color: '#a13f32', marginTop: 10 },
});
