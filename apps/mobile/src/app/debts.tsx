import { router } from 'expo-router';
import { View, TextInput, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useStockLite } from '@/context/StockLiteContext';
import { DebtRow, EmptyState, PrimaryButton, Screen, SectionHeader, StatCard, useTheme } from '@/components/stock-ui';
import { formatNaira } from '@/utils/currency';

function isOverdue(debt: { status: string; dueDate: string }): boolean {
  return debt.status === 'Outstanding' && new Date(debt.dueDate).getTime() < Date.now();
}

export default function DebtsScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { debts, markDebtPaid } = useStockLite();
  const [query, setQuery] = useState('');
  const outstanding = debts.filter((debt) => debt.status !== 'Paid');
  const total = outstanding.reduce((sum, debt) => sum + Math.max(0, debt.amount - debt.amountPaid), 0);
  const overdueCount = debts.filter(isOverdue).length;

  const filtered = debts
    .filter((debt) => debt.customerName.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => {
      const aOverdue = isOverdue(a);
      const bOverdue = isOverdue(b);
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
      if (a.status === 'Paid' && b.status !== 'Paid') return 1;
      if (b.status === 'Paid' && a.status !== 'Paid') return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  return (
    <Screen title="Debts" subtitle="Money owed to you">
      <StatCard label="Total outstanding" value={formatNaira(total)} accent />
      {overdueCount > 0 ? (
        <StatCard label="Overdue" value={String(overdueCount)} />
      ) : null}
      <PrimaryButton label="Add debt" onPress={() => router.push('/add-debt')} />
      <SectionHeader title="Customer balances" />
      {debts.length > 5 ? (
        <TextInput accessibilityLabel="Search debts" value={query} onChangeText={setQuery} placeholder="Search by customer name" placeholderTextColor={colors.muted} style={styles.search} />
      ) : null}
      {filtered.length ? (
        <View>{filtered.map((debt) => <DebtRow key={debt.id} debt={debt} onPaid={() => debt.status !== 'Paid' && markDebtPaid(debt.id)} onPress={() => router.push(`/edit-debt?id=${debt.id}` as never)} />)}</View>
      ) : (
        <EmptyState title={debts.length === 0 ? 'No debts recorded' : 'No matching debts'} text={debts.length === 0 ? "You're all caught up." : 'Try a different search term.'} />
      )}
    </Screen>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({ search: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 13, fontSize: 16, color: colors.ink, marginBottom: 10 } });
}
