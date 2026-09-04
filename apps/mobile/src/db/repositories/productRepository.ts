import type { SQLiteDatabase } from 'expo-sqlite';
import type { Product } from '@/types';
import { getActiveUserId, getDatabase } from '../database';

export async function getProducts(): Promise<Product[]> {
  const db = await getDatabase();
  const products = await db.getAllAsync<Product>(
    `SELECT id, name, sellingPrice, costPrice, quantity, lowStockThreshold, createdAt, updatedAt 
    FROM products
    WHERE ownerId = ?
     ORDER BY updatedAt DESC`
      , [getActiveUserId()]
  );
  return products;
}

export async function getProduct(id: string): Promise<Product | null> {
  const db = await getDatabase();
  const product = await db.getFirstAsync<Product>(
    `SELECT id, name, sellingPrice, costPrice, quantity, lowStockThreshold, createdAt, updatedAt 
     FROM products 
    WHERE id = ? AND ownerId = ?`,
      [id, getActiveUserId()]
  );
  return product || null;
}

export async function createProduct(
  product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Product> {
  const db = await getDatabase();
  const id = `p${Date.now()}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO products (id, ownerId, name, sellingPrice, costPrice, quantity, lowStockThreshold, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      getActiveUserId(),
      product.name,
      product.sellingPrice,
      product.costPrice,
      product.quantity,
      product.lowStockThreshold,
      now,
      now,
    ]
  );

  return {
    id,
    ...product,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateProduct(
  id: string,
  updates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Product | null> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const current = await getProduct(id);
  if (!current) return null;

  const updated = { ...current, ...updates, updatedAt: now };

  await db.runAsync(
    `UPDATE products 
     SET name = ?, sellingPrice = ?, costPrice = ?, quantity = ?, lowStockThreshold = ?, updatedAt = ?
     WHERE id = ? AND ownerId = ?`,
    [
      updated.name,
      updated.sellingPrice,
      updated.costPrice,
      updated.quantity,
      updated.lowStockThreshold,
      now,
      id,
      getActiveUserId(),
    ]
  );

  return updated;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.runAsync(`DELETE FROM products WHERE id = ? AND ownerId = ?`, [id, getActiveUserId()]);
  return (result.changes ?? 0) > 0;
}

export async function updateProductQuantity(
  id: string,
  quantityDelta: number
): Promise<Product | null> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `UPDATE products SET quantity = quantity + ?, updatedAt = ?
     WHERE id = ? AND ownerId = ? AND quantity + ? >= 0`,
    [quantityDelta, new Date().toISOString(), id, getActiveUserId(), quantityDelta]
  );
  if ((result.changes ?? 0) === 0) return null;
  return getProduct(id);
}
