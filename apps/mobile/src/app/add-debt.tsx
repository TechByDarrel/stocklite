import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Field, PrimaryButton, Screen } from '@/components/stock-ui';
import { useStockLite } from '@/context/StockLiteContext';

export default function AddDebtScreen() {
  const { addDebt } = useStockLite();
  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const save = async () => {
    const value = Number(amount);
    const parsedDate = new Date(dueDate);

    if (!customerName.trim()) {
      setError('Customer name is required.');
      return;
    }

    if (!Number.isFinite(value) || value <= 0) {
      setError('Amount must be a positive number.');
      return;
    }

    if (!dueDate.trim() || Number.isNaN(parsedDate.getTime())) {
      setError('Enter a valid due date.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await addDebt({
        customerName: customerName.trim(),
        amount: value,
        description: description.trim(),
        dueDate: parsedDate.toISOString(),
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save debt');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen title="Add debt" subtitle="Track money owed to your business" back>
      <Field
        label="Customer name"
        value={customerName}
        onChangeText={setCustomerName}
        placeholder="e.g. Chinedu"
        editable={!isLoading}
      />
      <Field
        label="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        placeholder="0"
        editable={!isLoading}
      />
      <Field
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="What was purchased?"
        editable={!isLoading}
      />
      <Field
        label="Due date"
        value={dueDate}
        onChangeText={setDueDate}
        placeholder="YYYY-MM-DD"
        editable={!isLoading}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton
        label={isLoading ? 'Saving...' : 'Save Debt'}
        onPress={save}
        disabled={isLoading}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: {
    color: '#a13f32',
    marginBottom: 8,
  },
});