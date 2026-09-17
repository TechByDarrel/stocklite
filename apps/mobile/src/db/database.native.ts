import * as SQLite from 'expo-sqlite';
import type { SQLiteDatabase } from './database.types';

let dbInstance: SQLiteDatabase | null = null;
let activeUserId = 'anonymous';

export function setActiveUser(userId: string): void {
  activeUserId = userId;
}

export function getActiveUserId(): string {
  return activeUserId;
}

export async function initializeDatabase(): Promise<SQLiteDatabase> {
  if (dbInstance) return dbInstance;

  const db = await SQLite.openDatabaseAsync('stocklite.db');
  dbInstance = db;

  try {
    await db.execAsync('PRAGMA journal_mode = WAL;');
  } catch (error) {
    console.warn('WAL mode not supported, continuing with default', error);
  }

  await initializeSchema(db);
  return db;
}

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  return initializeDatabase();
}

async function initializeSchema(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      displayName TEXT,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      passwordSalt TEXT,
      businessName TEXT,
      photoUri TEXT,
      firebaseUid TEXT,
      createdAt TEXT NOT NULL,
      lastLoginAt TEXT
    );
  `);

  const users = await db.getAllAsync<{ id: string }>('SELECT id FROM users ORDER BY createdAt ASC LIMIT 1');
  const legacyOwner = users[0]?.id || null;
  const tables = await db.getAllAsync<{ name: string }>(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='products'`
  );

  if (tables.length === 0) {
    await db.execAsync(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      ownerId TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      sellingPrice REAL NOT NULL,
      costPrice REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      lowStockThreshold INTEGER NOT NULL DEFAULT 0,
      photoUri TEXT,
      syncedAt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES users(id),
      total REAL NOT NULL,
      profit REAL NOT NULL,
      syncedAt TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES users(id),
      saleId TEXT NOT NULL,
      productId TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unitPrice REAL NOT NULL,
      unitCost REAL NOT NULL,
      syncedAt TEXT,
      FOREIGN KEY (saleId) REFERENCES sales(id) ON DELETE CASCADE,
      FOREIGN KEY (productId) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      note TEXT,
      syncedAt TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS debts (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES users(id),
      customerName TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      amountPaid REAL NOT NULL DEFAULT 0,
      dueDate TEXT NOT NULL,
      status TEXT NOT NULL,
      syncedAt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sales_createdAt ON sales(createdAt DESC);
    CREATE INDEX IF NOT EXISTS idx_expenses_createdAt ON expenses(createdAt DESC);
    CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
    CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
  `);
    await db.runAsync(`INSERT OR REPLACE INTO schema_meta (key, value) VALUES ('version', '2')`);
    return;
  }

  const addColumn = async (table: string, column: string) => {
    try {
      await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} TEXT`);
    } catch {
      // The migration is safe to rerun when the column already exists.
    }
  };

  await addColumn('products', 'ownerId');
  await addColumn('users', 'displayName');
  await addColumn('sales', 'userId');
  await addColumn('sale_items', 'userId');
  await addColumn('expenses', 'userId');
  await addColumn('debts', 'userId');
  await addColumn('users', 'photoUri');
  await addColumn('products', 'photoUri');
  await addColumn('users', 'passwordSalt');
  await addColumn('products', 'syncedAt');
  await addColumn('sales', 'syncedAt');
  await addColumn('sale_items', 'syncedAt');
  await addColumn('expenses', 'syncedAt');
  await addColumn('debts', 'syncedAt');
  await addColumn('users', 'firebaseUid');

  if (legacyOwner) {
    for (const table of ['products', 'sales', 'sale_items', 'expenses', 'debts']) {
      const column = table === 'products' ? 'ownerId' : 'userId';
      await db.runAsync(`UPDATE ${table} SET ${column} = ? WHERE ${column} IS NULL OR ${column} = 'legacy'`, [legacyOwner]);
    }
  }

  await db.runAsync(`INSERT OR REPLACE INTO schema_meta (key, value) VALUES ('version', '2')`);
}

export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
  }
}