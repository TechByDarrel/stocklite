import type { Debt, DebtStatus } from '@/types';
import { getActiveUserId, getDatabase } from '../database';

export async function getDebts(): Promise<Debt[]> {
  const db = await getDatabase();
  const debts = await db.getAllAsync<Debt & { amountPaid: number }>(
    `SELECT id, customerName, description, amount, amountPaid, dueDate, status, createdAt, updatedAt 
     FROM debts 
    WHERE userId = ? ORDER BY createdAt DESC`,
      [getActiveUserId()]
  );
  return debts.map((debt) => ({
    ...debt,
  })) as Debt[];
}

export async function getDebt(id: string): Promise<Debt | null> {
  const db = await getDatabase();
  const debt = await db.getFirstAsync<Debt & { amountPaid: number }>(
    `SELECT id, customerName, description, amount, amountPaid, dueDate, status, createdAt, updatedAt 
     FROM debts 
    WHERE id = ? AND userId = ?`,
      [id, getActiveUserId()]
  );
  return debt ? (debt as Debt) : null;
}

export async function createDebt(
  debt: Omit<Debt, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'amountPaid'>
): Promise<Debt> {
  const db = await getDatabase();
  const id = `d${Date.now()}`;
  const now = new Date().toISOString();
  const status: DebtStatus = 'Outstanding';

  await db.runAsync(
    `INSERT INTO debts (id, userId, customerName, description, amount, amountPaid, dueDate, status, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, getActiveUserId(), debt.customerName, debt.description, debt.amount, 0, debt.dueDate, status, now, now]
  );

  return {
    id,
    ...debt,
    amountPaid: 0,
    status,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateDebtStatus(
  id: string,
  status: DebtStatus
): Promise<Debt | null> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const current = await getDebt(id);
  if (!current) return null;

  await db.runAsync(
    `UPDATE debts SET status = ?, updatedAt = ? WHERE id = ? AND userId = ?`,
    [status, now, id, getActiveUserId()]
  );

  return {
    ...current,
    status,
    updatedAt: now,
  };
}

export async function updateDebtPayment(
  id: string,
  amountPaid: number
): Promise<Debt | null> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const current = await getDebt(id);
  if (!current) return null;

  const newStatus: DebtStatus = amountPaid >= current.amount ? 'Paid' : 'Outstanding';

  await db.runAsync(
    `UPDATE debts SET amountPaid = ?, status = ?, updatedAt = ? WHERE id = ? AND userId = ?`,
    [amountPaid, newStatus, now, id, getActiveUserId()]
  );

  return {
    ...current,
    amountPaid,
    status: newStatus,
    updatedAt: now,
  };
}

export async function markDebtPaid(id: string): Promise<Debt | null> {
  const current = await getDebt(id);
  return current ? updateDebtPayment(id, current.amount) : null;
}

export async function getOutstandingDebts(): Promise<Debt[]> {
  const db = await getDatabase();
  const debts = await db.getAllAsync<Debt & { amountPaid: number }>(
    `SELECT id, customerName, description, amount, amountPaid, dueDate, status, createdAt, updatedAt 
     FROM debts 
    WHERE status = 'Outstanding' AND userId = ?
    ORDER BY dueDate ASC`,
      [getActiveUserId()]
  );
  return debts.map((debt) => debt as Debt);
}

export async function getTotalOutstandingDebt(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount - COALESCE(amountPaid, 0)), 0) as total FROM debts WHERE status = 'Outstanding' AND userId = ?`,
    [getActiveUserId()]
  );
  return result?.total || 0;
}

export async function deleteDebt(id: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.runAsync(`DELETE FROM debts WHERE id = ? AND userId = ?`, [id, getActiveUserId()]);
  return (result.changes ?? 0) > 0;
}

export async function updateDebt(
  id: string,
  updates: Partial<Pick<Debt, 'customerName' | 'description' | 'amount' | 'dueDate'>>
): Promise<Debt | null> {
  const db = await getDatabase();
  const current = await getDebt(id);
  if (!current) return null;
  const now = new Date().toISOString();

  const merged = { ...current, ...updates };
  const status: DebtStatus = merged.amountPaid >= merged.amount ? 'Paid' : 'Outstanding';

  await db.runAsync(
    `UPDATE debts SET customerName = ?, description = ?, amount = ?, dueDate = ?, status = ?, updatedAt = ? WHERE id = ? AND userId = ?`,
    [merged.customerName, merged.description, merged.amount, merged.dueDate, status, now, id, getActiveUserId()]
  );

  return { ...merged, status, updatedAt: now };
}
