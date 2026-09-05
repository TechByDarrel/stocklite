import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Text } from 'react-native';
import { Field, PrimaryButton, Screen, SecondaryButton } from '@/components/stock-ui';
import { useStockLite } from '@/context/StockLiteContext';

export default function EditDebtScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { debts, updateDebt, deleteDebt, markDebtPaid } = useStockLite();
  const debt = debts.find((d) => d.id === id);

  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMarking, setIsMarking] = useState(false);

  useEffect(() => {
    if (debt) {
      setCustomerName(debt.customerName);
      setAmount(String(debt.amount));
      setDescription(debt.description);
      setDueDate(debt.dueDate.slice(0, 10));
    }
  }, [debt]);

  if (!debt) {
    return (
      <Screen title="Debt not found" back>
        <Text style={styles.error}>This debt could not be found. It may have been deleted.</Text>
      </Screen>
    );
  }

  const save = async () => {
    setError('');
    const value = Number(amount);
    const parsedDate = new Date(dueDate);

    if (!customerName.trim()) return setError('Customer name is required.');
    if (!Number.isFinite(value) || value <= 0) return setError('Amount must be a positive number.');
    if (!dueDate.trim() || Number.isNaN(parsedDate.getTime())) return setError('Enter a valid due date.');

    try {
      setIsSaving(true);
      await updateDebt(debt.id, {
        customerName: customerName.trim(),
        amount: value,
        description: description.trim(),
        dueDate: parsedDate.toISOString(),
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
      if (window.confirm(`Delete debt for "${debt.customerName}"? This cannot be undone.`)) {
        runDelete();
      }
      return;
    }
    Alert.alert('Delete debt', `Delete debt for "${debt.customerName}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: runDelete },
    ]);
  };

  const runDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteDebt(debt.id);
      router.back();
    } catch {
      setError('Could not delete this debt. Please try again.');
      setIsDeleting(false);
    }
  };

  const handleMarkPaid = async () => {
    try {
      setIsMarking(true);
      await markDebtPaid(debt.id);
      router.back();
    } catch {
      setError('Could not update payment status. Please try again.');
      setIsMarking(false);
    }
  };

  const busy = isSaving || isDeleting || isMarking;

  return (
    <Screen title="Edit debt" subtitle="Update this customer's balance" back>
      <Field label="Customer name" value={customerName} onChangeText={setCustomerName} placeholder="e.g. Chinedu" editable={!busy} />
      <Field label="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" editable={!busy} />
      <Field label="Description" value={description} onChangeText={setDescription} placeholder="What was purchased?" editable={!busy} />
      <Field label="Due date" value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" editable={!busy} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label={isSaving ? 'Saving...' : 'Save changes'} onPress={save} disabled={busy} />
      {debt.status !== 'Paid' ? (
        <SecondaryButton label={isMarking ? 'Updating...' : 'Mark as paid'} onPress={handleMarkPaid} />
      ) : null}
      <SecondaryButton label={isDeleting ? 'Deleting...' : 'Delete debt'} onPress={confirmDelete} />
    </Screen>
  );
}

const styles = StyleSheet.create({ error: { color: '#a13f32', marginBottom: 8 } });