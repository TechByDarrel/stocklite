import { router } from 'expo-router';
import { View } from 'react-native';
import { useStockLite } from '@/context/StockLiteContext';
import { EmptyState, ExpenseRow, PrimaryButton, Screen, SectionHeader, StatCard } from '@/components/stock-ui';
import { formatNaira } from '@/utils/currency';
const today = (value: string) => new Date(value).toDateString() === new Date().toDateString();
export default function ExpensesScreen() { const { expenses } = useStockLite(); const total = expenses.filter((expense) => today(expense.createdAt)).reduce((sum, expense) => sum + expense.amount, 0); return <Screen title="Expenses" subtitle="Know where your money goes"><StatCard label="Total expenses today" value={formatNaira(total)} accent /><PrimaryButton label="+ Add Expense" onPress={() => router.push('/add-expense')} /><SectionHeader title="Recent expenses" />{expenses.length ? <View>{expenses.map((expense) => <ExpenseRow key={expense.id} expense={expense} />)}</View> : <EmptyState title="No expenses yet" text="Add shop expenses to keep your profit picture honest." />}</Screen>; }