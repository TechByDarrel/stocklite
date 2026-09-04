import type { Sale, SaleItem } from '@/types';
import { getActiveUserId, getDatabase } from '../database';
import * as productRepo from './productRepository';

export async function getSales(): Promise<Sale[]> {
  const db = await getDatabase();
  const sales = await db.getAllAsync<Sale>(
    `SELECT id, total, profit, createdAt FROM sales WHERE userId = ? ORDER BY createdAt DESC`,
    [getActiveUserId()]
  );

  // Load items for each sale
  const salesWithItems = await Promise.all(
    sales.map(async (sale) => ({
      ...sale,
      items: await getSaleItems(sale.id),
    }))
  );

  return salesWithItems;
}

export async function getSaleItems(saleId: string): Promise<SaleItem[]> {
  const db = await getDatabase();
  const items = await db.getAllAsync<SaleItem>(
    `SELECT sale_items.productId, products.name AS productName, sale_items.quantity, sale_items.unitPrice, sale_items.unitCost
     FROM sale_items JOIN products ON products.id = sale_items.productId
     WHERE sale_items.saleId = ? AND sale_items.userId = ?`,
    [saleId, getActiveUserId()]
  );
  return items;
}

export async function createSale(items: SaleItem[]): Promise<Sale> {
  const db = await getDatabase();
  const saleId = `s${Date.now()}`;
  const createdAt = new Date().toISOString();

  // Calculate totals
  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const profit = items.reduce((sum, item) => sum + (item.unitPrice - item.unitCost) * item.quantity, 0);

  try {
    // Begin transaction
    await db.execAsync('BEGIN TRANSACTION');

    // Insert sale
    await db.runAsync(
      `INSERT INTO sales (id, userId, total, profit, createdAt) VALUES (?, ?, ?, ?, ?)`,
      [saleId, getActiveUserId(), total, profit, createdAt]
    );

    // Insert sale items and update product quantities
    for (const item of items) {
      const product = await productRepo.updateProductQuantity(item.productId, -item.quantity);
      if (!product) {
        throw new Error(`Insufficient stock for ${item.productName}`);
      }
      const itemId = `si${Date.now()}_${Math.random()}`;
      await db.runAsync(
        `INSERT INTO sale_items (id, userId, saleId, productId, quantity, unitPrice, unitCost) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [itemId, getActiveUserId(), saleId, item.productId, item.quantity, item.unitPrice, item.unitCost]
      );

    }

    // Commit transaction
    await db.execAsync('COMMIT');
  } catch (error) {
    // Rollback on error
    try {
      await db.execAsync('ROLLBACK');
    } catch (e) {
      console.error('Failed to rollback transaction:', e);
    }
    throw error;
  }

  return {
    id: saleId,
    items,
    total,
    profit,
    createdAt,
  };
}

export async function getSaleById(id: string): Promise<Sale | null> {
  const db = await getDatabase();
  const sale = await db.getFirstAsync<Sale>(
    `SELECT id, total, profit, createdAt FROM sales WHERE id = ? AND userId = ?`,
    [id, getActiveUserId()]
  );

  if (!sale) return null;

  return {
    ...sale,
    items: await getSaleItems(id),
  };
}
