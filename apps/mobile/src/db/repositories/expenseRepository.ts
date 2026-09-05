import type { Expense, ExpenseCategory } from '@/types';
import { getActiveUserId, getDatabase } from '../database';

export async function getExpenses(): Promise<Expense[]> {
  const db = await getDatabase();
  const expenses = await db.getAllAsync<Expense>(
    `SELECT id, title, amount, category, note, createdAt FROM expenses WHERE userId = ? ORDER BY createdAt DESC`,
    [getActiveUserId()]
  );
  return expenses;
}

export async function getExpense(id: string): Promise<Expense | null> {
  const db = await getDatabase();
  const expense = await db.getFirstAsync<Expense>(
    `SELECT id, title, amount, category, note, createdAt FROM expenses WHERE id = ? AND userId = ?`,
    [id, getActiveUserId()]
  );
  return expense || null;
}

export async function createExpense(
  expense: Omit<Expense, 'id' | 'createdAt'>
): Promise<Expense> {
  const db = await getDatabase();
  const id = `e${Date.now()}`;
  const createdAt = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO expenses (id, userId, title, amount, category, note, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, getActiveUserId(), expense.title, expense.amount, expense.category, expense.note || null, createdAt]
  );

  return {
    id,
    ...expense,
    createdAt,
  };
}

export async function deleteExpense(id: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.runAsync(`DELETE FROM expenses WHERE id = ? AND userId = ?`, [id, getActiveUserId()]);
  return (result.changes ?? 0) > 0;
}

export async function updateExpense(
  id: string,
  updates: Partial<Omit<Expense, 'id' | 'createdAt'>>
): Promise<Expense | null> {
  const db = await getDatabase();
  const current = await getExpense(id);
  if (!current) return null;

  const updated = { ...current, ...updates };

  await db.runAsync(
    `UPDATE expenses SET title = ?, amount = ?, category = ?, note = ? WHERE id = ? AND userId = ?`,
    [updated.title, updated.amount, updated.category, updated.note || null, id, getActiveUserId()]
  );

  return updated;
}

export async function getExpensesByCategory(category: ExpenseCategory): Promise<Expense[]> {
  const db = await getDatabase();
  const expenses = await db.getAllAsync<Expense>(
    `SELECT id, title, amount, category, note, createdAt FROM expenses WHERE category = ? AND userId = ? ORDER BY createdAt DESC`,
    [category, getActiveUserId()]
  );
  return expenses;
}

export async function getTotalExpenses(startDate?: string, endDate?: string): Promise<number> {
  const db = await getDatabase();
  let query = `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE userId = ?`;
  const params: string[] = [getActiveUserId()];

  if (startDate || endDate) {
    query += ` AND`;
    if (startDate) {
      query += ` createdAt >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      if (startDate) query += ` AND`;
      query += ` createdAt <= ?`;
      params.push(endDate);
    }
  }

  const result =
    params.length > 0
      ? await db.getFirstAsync<{ total: number }>(query, params)
      : await db.getFirstAsync<{ total: number }>(query);
  return result?.total || 0;
}
