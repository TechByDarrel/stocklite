import { router } from 'expo-router';
import { View, TextInput, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useStockLite } from '@/context/StockLiteContext';
import { DebtRow, EmptyState, PrimaryButton, Screen, SectionHeader, StatCard } from '@/components/stock-ui';
import { formatNaira } from '@/utils/currency';
export default function DebtsScreen() {
  const { debts, markDebtPaid } = useStockLite();
  const [query, setQuery] = useState('');
  const outstanding = debts.filter((debt) => debt.status !== 'Paid');
  const total = outstanding.reduce((sum, debt) => sum + Math.max(0, debt.amount - debt.amountPaid), 0);
  const filtered = debts.filter((debt) => debt.customerName.toLowerCase().includes(query.trim().toLowerCase()));
  return <Screen title="Debts" subtitle="Money owed to you">
    <StatCard label="Total outstanding" value={formatNaira(total)} accent />
    <PrimaryButton label="Add debt" onPress={() => router.push('/add-debt')} />
    <SectionHeader title="Customer balances" />
    {debts.length > 5 ? <TextInput accessibilityLabel="Search debts" value={query} onChangeText={setQuery} placeholder="Search by customer name" placeholderTextColor="#9aa59d" style={styles.search} /> : null}
    {filtered.length ? <View>{filtered.map((debt) => <DebtRow key={debt.id} debt={debt} onPaid={() => debt.status !== 'Paid' && markDebtPaid(debt.id)} onPress={() => router.push(`/edit-debt?id=${debt.id}` as never)} />)}</View> : <EmptyState title={debts.length === 0 ? 'No debts recorded' : 'No matching debts'} text={debts.length === 0 ? "You're all caught up." : 'Try a different search term.'} />}
  </Screen>;
}
const styles = StyleSheet.create({ search: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#dbe4dc', borderRadius: 8, padding: 13, fontSize: 16, color: '#16221c', marginBottom: 10 } });