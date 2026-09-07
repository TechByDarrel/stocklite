import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Field, PrimaryButton, Screen } from '@/components/stock-ui';
import { useStockLite } from '@/context/StockLiteContext';
import type { ExpenseCategory } from '@/types';

const categories: ExpenseCategory[] = ['Transport', 'Electricity', 'Diesel', 'Rent', 'Staff wages', 'Stock purchase', 'Data/Airtime', 'Repairs', 'Supplies', 'Other'];

export default function AddExpenseScreen() {
  const { addExpense } = useStockLite();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Other');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    setError('');
    const value = Number(amount);
    if (!title.trim()) return setError('Title is required.');
    if (!Number.isFinite(value) || value <= 0) return setError('Amount must be a positive number.');
    try {
      setIsSaving(true);
      await addExpense({ title: title.trim(), amount: value, category, note: note.trim() || undefined });
      router.back();
    } catch {
      setError('Could not save this expense. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Screen title="Add expense" subtitle="Record a cost for your shop" back>
      <Field label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Diesel for generator" editable={!isSaving} />
      <Field label="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" editable={!isSaving} />
      <Text style={styles.label}>Category</Text>
      <View style={styles.categories}>
        {categories.map((item) => (
          <Pressable key={item} onPress={() => setCategory(item)} style={[styles.category, category === item && styles.selected]}>
            <Text style={category === item ? styles.selectedText : styles.categoryText}>{item}</Text>
          </Pressable>
        ))}
      </View>
      <Field label="Note (optional)" value={note} onChangeText={setNote} placeholder="Add a note" editable={!isSaving} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label={isSaving ? 'Saving...' : 'Save expense'} onPress={save} disabled={isSaving} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { color: '#16221c', fontWeight: '700', marginBottom: 8 },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  category: { borderWidth: 1, borderColor: '#dfe6df', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 7, backgroundColor: '#fff' },
  selected: { backgroundColor: '#176b45', borderColor: '#176b45' },
  categoryText: { color: '#6b776f' },
  selectedText: { color: '#fff', fontWeight: '700' },
  error: { color: '#a13f32' },
});