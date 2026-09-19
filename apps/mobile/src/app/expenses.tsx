import { router } from 'expo-router';
import { View } from 'react-native';
import { useStockLite } from '@/context/StockLiteContext';
import { EmptyState, ExpenseRow, PrimaryButton, Screen, SectionHeader, StatCard, useTheme } from '@/components/stock-ui';
import { formatNaira } from '@/utils/currency';
import { useState } from 'react';
import { TextInput, StyleSheet } from 'react-native';
const today = (value: string) => new Date(value).toDateString() === new Date().toDateString();
export default function ExpensesScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { expenses } = useStockLite();
  const [query, setQuery] = useState('');
  const total = expenses.filter((expense) => today(expense.createdAt)).reduce((sum, expense) => sum + expense.amount, 0);
  const filtered = expenses.filter((expense) => expense.title.toLowerCase().includes(query.trim().toLowerCase()) || expense.category.toLowerCase().includes(query.trim().toLowerCase()));
  return <Screen title="Expenses" subtitle="Know where your money goes">
    <StatCard label="Total expenses today" value={formatNaira(total)} accent />
    <PrimaryButton label="+ Add Expense" onPress={() => router.push('/add-expense')} />
    <SectionHeader title="Recent expenses" />
    {expenses.length > 5 ? <TextInput accessibilityLabel="Search expenses" value={query} onChangeText={setQuery} placeholder="Search expenses" placeholderTextColor={colors.muted} style={styles.search} /> : null}
    {filtered.length ? <View>{filtered.map((expense) => <ExpenseRow key={expense.id} expense={expense} onPress={() => router.push(`/edit-expense?id=${expense.id}` as never)} />)}</View> : <EmptyState title={expenses.length === 0 ? 'No expenses yet' : 'No matching expenses'} text={expenses.length === 0 ? 'Add shop expenses to keep your profit picture honest.' : 'Try a different search term.'} />}
  </Screen>;
}
function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({ search: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 13, fontSize: 16, color: colors.ink, marginBottom: 10 } });
}
