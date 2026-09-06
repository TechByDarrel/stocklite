import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Field, PrimaryButton, Screen, SecondaryButton } from '@/components/stock-ui';
import { useStockLite } from '@/context/StockLiteContext';
import type { ExpenseCategory } from '@/types';

const categories: ExpenseCategory[] = ['Transport', 'Electricity', 'Diesel', 'Supplies', 'Other'];

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { expenses, updateExpense, deleteExpense } = useStockLite();
  const expense = expenses.find((e) => e.id === id);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Other');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (expense) {
      setTitle(expense.title);
      setAmount(String(expense.amount));
      setCategory(expense.category);
      setNote(expense.note || '');
    }
  }, [expense]);

  if (!expense) {
    return (
      <Screen title="Expense not found" back>
        <Text style={styles.error}>This expense could not be found. It may have been deleted.</Text>
      </Screen>
    );
  }

  const hasChanges =
    title.trim() !== expense.title ||
    Number(amount) !== expense.amount ||
    category !== expense.category ||
    (note.trim() || undefined) !== (expense.note || undefined);

  const save = async () => {
    setError('');
    const value = Number(amount);
    if (!title.trim()) return setError('Title is required.');
    if (!Number.isFinite(value) || value <= 0) return setError('Amount must be a positive number.');

    try {
      setIsSaving(true);
      await updateExpense(expense.id, {
        title: title.trim(),
        amount: value,
        category,
        note: note.trim() || undefined,
      });
      router.back();
    } catch {
      setError('Could not save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = () => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${expense.title}"? This cannot be undone.`)) {
        runDelete();
      }
      return;
    }
    Alert.alert('Delete expense', `Delete "${expense.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: runDelete },
    ]);
  };

  const runDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteExpense(expense.id);
      router.back();
    } catch {
      setError('Could not delete this expense. Please try again.');
      setIsDeleting(false);
    }
  };

  const busy = isSaving || isDeleting;

  return (
    <Screen title="Edit expense" subtitle="Update this expense's details" back>
      <Field label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Diesel for generator" editable={!busy} />
      <Field label="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" editable={!busy} />
      <Text style={styles.label}>Category</Text>
      <View style={styles.categories}>
        {categories.map((item) => (
          <Pressable key={item} onPress={() => setCategory(item)} style={[styles.category, category === item && styles.selected]} disabled={busy}>
            <Text style={category === item ? styles.selectedText : styles.categoryText}>{item}</Text>
          </Pressable>
        ))}
      </View>
      <Field label="Note (optional)" value={note} onChangeText={setNote} placeholder="Add a note" editable={!busy} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label={isSaving ? 'Saving...' : 'Save changes'} onPress={save} disabled={busy || !hasChanges} />
      <SecondaryButton label={isDeleting ? 'Deleting...' : 'Delete expense'} onPress={confirmDelete} />
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
  error: { color: '#a13f32', marginBottom: 8 },
});