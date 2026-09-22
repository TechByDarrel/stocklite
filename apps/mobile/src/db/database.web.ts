import type { SQLiteDatabase } from './database.types';

let dbInstance: SQLiteDatabase | null = null;
let activeUserId = 'anonymous';
const USERS_KEY = 'stocklite.users';

type StoredRecord = Record<string, any>;

interface WebUser extends StoredRecord {
  id: string;
  displayName?: string;
  email: string;
  passwordHash: string;
  passwordSalt?: string | null;
  businessName: string;
  photoUri?: string | null;
  firebaseUid?: string | null;
  biometricEnabled?: string | null;
  lastUsedAt?: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof localStorage !== 'undefined') localStorage.setItem(key, JSON.stringify(value));
}

function readUsers(): WebUser[] { return readJson<WebUser[]>(USERS_KEY, []); }
function writeUsers(users: WebUser[]): void { writeJson(USERS_KEY, users); }
function storageKey(table: string): string { return `stocklite.${table}.${activeUserId}`; }
function readRecords<T extends StoredRecord>(table: string): T[] { return readJson<T[]>(storageKey(table), []); }
function writeRecords(table: string, records: StoredRecord[]): void { writeJson(storageKey(table), records); }
function paramsOf(rawParams: any[]): any[] { return rawParams.length === 1 && Array.isArray(rawParams[0]) ? rawParams[0] : rawParams; }

export function setActiveUser(userId: string): void { activeUserId = userId; }
export function getActiveUserId(): string { return activeUserId; }

function createMockDatabase(): SQLiteDatabase {
  let transactionSnapshot: Record<string, StoredRecord[]> | null = null;
  return {
    execAsync: async (sql: string) => {
      if (sql.includes('BEGIN')) {
        transactionSnapshot = Object.fromEntries(['products', 'sales', 'sale_items', 'expenses', 'debts'].map((table) => [table, readRecords(table)]));
      } else if (sql.includes('ROLLBACK') && transactionSnapshot) {
        Object.entries(transactionSnapshot).forEach(([table, records]) => writeRecords(table, records));
        transactionSnapshot = null;
      } else if (sql.includes('COMMIT')) {
        transactionSnapshot = null;
      }
    },
    getAllAsync: async <T = any>(sql: string, ...rawParams: any[]) => {
      const params = paramsOf(rawParams);
      if (sql.includes('FROM users')) return readUsers() as T[];
      if (sql.includes('FROM products')) return readRecords('products').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) as T[];
      if (sql.includes('FROM sales')) return readRecords('sales').sort((a, b) => b.createdAt.localeCompare(a.createdAt)) as T[];
      if (sql.includes('FROM sale_items')) {
        const products = readRecords('products');
        return readRecords('sale_items').filter((item) => item.saleId === params[0]).map((item) => ({ ...item, productName: products.find((product) => product.id === item.productId)?.name })) as T[];
      }
      if (sql.includes('FROM expenses')) return readRecords('expenses').sort((a, b) => b.createdAt.localeCompare(a.createdAt)) as T[];
      if (sql.includes('FROM debts')) return readRecords('debts').sort((a, b) => b.createdAt.localeCompare(a.createdAt)) as T[];
      return [] as T[];
    },
    getFirstAsync: async <T = any>(sql: string, ...rawParams: any[]) => {
      const params = paramsOf(rawParams);
      if (sql.includes('lastLoginAt IS NOT NULL')) {
        const user = readUsers().filter((item) => item.lastLoginAt).sort((a, b) => (b.lastLoginAt || '').localeCompare(a.lastLoginAt || ''))[0];
        return (user ? { id: user.id, displayName: user.displayName, email: user.email, businessName: user.businessName, photoUri: user.photoUri ?? null, firebaseUid: user.firebaseUid ?? null } : null) as T | null;
      }
      // Biometric login: find the most recently used biometric-enabled account, regardless of login state.
      if (sql.includes('biometricEnabled')) {
        const user = readUsers()
          .filter((item) => item.biometricEnabled === 'true')
          .sort((a, b) => (b.lastUsedAt || '').localeCompare(a.lastUsedAt || ''))[0];
        return (user ? {
          id: user.id,
          displayName: user.displayName,
          email: user.email,
          businessName: user.businessName,
          photoUri: user.photoUri ?? null,
          firebaseUid: user.firebaseUid ?? null,
        } : null) as T | null;
      }
      // Sync service: looks up just the firebaseUid for a given local user id.
      if (sql.includes('SELECT firebaseUid FROM users')) {
        const user = readUsers().find((item) => item.id === params[0]);
        return (user ? { firebaseUid: user.firebaseUid ?? null } : null) as T | null;
      }
      // Login query: selects passwordHash/passwordSalt to verify credentials.
      if (sql.includes('FROM users') && sql.includes('passwordHash')) {
        const user = readUsers().find((item) => item.email === params[0]);
        return (user ? {
          id: user.id,
          displayName: user.displayName,
          email: user.email,
          businessName: user.businessName,
          photoUri: user.photoUri ?? null,
          passwordHash: user.passwordHash,
          passwordSalt: user.passwordSalt ?? null,
          firebaseUid: user.firebaseUid ?? null,
        } : null) as T | null;
      }
      // Signup duplicate-check: only selects id.
      if (sql.includes('FROM users') && sql.includes('WHERE email = ?')) {
        const user = readUsers().find((item) => item.email === params[0]);
        return (user ? { id: user.id } : null) as T | null;
      }
      const table = sql.includes('FROM products') ? 'products' : sql.includes('FROM expenses') ? 'expenses' : sql.includes('FROM debts') ? 'debts' : sql.includes('FROM sales') ? 'sales' : '';
      if (table) {
        const record = readRecords(table).find((item) => item.id === params[0]);
        return (record || null) as T | null;
      }
      return null;
    },
    runAsync: async (sql: string, ...rawParams: any[]) => {
      const params = paramsOf(rawParams);
      let changes = 1;
      if (sql.includes('INSERT INTO users')) {
        const [id, displayName, email, passwordHash, businessName, createdAt, lastLoginAt] = params;
        writeUsers([...readUsers(), { id, displayName, email, passwordHash, passwordSalt: null, businessName, photoUri: null, firebaseUid: null, biometricEnabled: null, lastUsedAt: lastLoginAt, createdAt, lastLoginAt }]);
      } else if (sql.includes('UPDATE users SET displayName')) {
        const [displayName, businessName, id] = params;
        writeUsers(readUsers().map((user) => user.id === id ? { ...user, displayName, businessName } : user));
      } else if (sql.includes('UPDATE users SET photoUri')) {
        const [photoUri, id] = params;
        writeUsers(readUsers().map((user) => user.id === id ? { ...user, photoUri } : user));
      } else if (sql.includes('UPDATE users SET passwordHash')) {
        const [passwordHash, passwordSalt, id] = params;
        writeUsers(readUsers().map((user) => user.id === id ? { ...user, passwordHash, passwordSalt } : user));
      } else if (sql.includes('UPDATE users SET passwordSalt')) {
        const [passwordSalt, id] = params;
        writeUsers(readUsers().map((user) => user.id === id ? { ...user, passwordSalt } : user));
      } else if (sql.includes('UPDATE users SET firebaseUid')) {
        const [firebaseUid, id] = params;
        writeUsers(readUsers().map((user) => user.id === id ? { ...user, firebaseUid } : user));
      } else if (sql.includes('UPDATE users SET biometricEnabled')) {
        const [biometricEnabled, id] = params;
        writeUsers(readUsers().map((user) => user.id === id ? { ...user, biometricEnabled } : user));
      } else if (sql.includes('UPDATE users SET lastUsedAt')) {
        const [lastUsedAt, id] = params;
        writeUsers(readUsers().map((user) => user.id === id ? { ...user, lastUsedAt } : user));
      } else if (sql.includes('UPDATE users SET lastLoginAt')) {
        const isLogout = sql.includes('SET lastLoginAt = NULL');
        const id = isLogout ? params[0] : params[1];
        const lastLoginAt = isLogout ? null : params[0];
        writeUsers(readUsers().map((user) => user.id === id ? { ...user, lastLoginAt } : user));
      } else if (sql.includes('INSERT INTO products')) {
        const [id, ownerId, name, sellingPrice, costPrice, quantity, lowStockThreshold, photoUri, createdAt, updatedAt] = params;
        writeRecords('products', [...readRecords('products'), { id, ownerId, name, sellingPrice, costPrice, quantity, lowStockThreshold, photoUri, syncedAt: null, createdAt, updatedAt }]);
      } else if (sql.includes('UPDATE products')) {
        if (sql.includes('SET quantity')) {
          const [quantityDelta, updatedAt, id, ownerId] = params;
          const records = readRecords('products');
          const canUpdate = records.some((item) => item.id === id && item.ownerId === ownerId && item.quantity + quantityDelta >= 0);
          changes = canUpdate ? 1 : 0;
          writeRecords('products', records.map((item) => item.id === id && item.ownerId === ownerId && item.quantity + quantityDelta >= 0 ? { ...item, quantity: item.quantity + quantityDelta, updatedAt, syncedAt: null } : item));
        } else if (sql.includes('SET syncedAt')) {
          const [syncedAt, id] = params;
          writeRecords('products', readRecords('products').map((item) => item.id === id ? { ...item, syncedAt } : item));
        } else {
          const [name, sellingPrice, costPrice, quantity, lowStockThreshold, photoUri, updatedAt, id, ownerId] = params;
          writeRecords('products', readRecords('products').map((item) => item.id === id && item.ownerId === ownerId ? { ...item, name, sellingPrice, costPrice, quantity, lowStockThreshold, photoUri, updatedAt, syncedAt: null } : item));
        }
      } else if (sql.includes('DELETE FROM products')) {
        writeRecords('products', readRecords('products').filter((item) => !(item.id === params[0] && item.ownerId === params[1])));
      } else if (sql.includes('INSERT INTO sales')) {
        const [id, userId, total, profit, createdAt] = params;
        writeRecords('sales', [...readRecords('sales'), { id, userId, total, profit, syncedAt: null, createdAt }]);
      } else if (sql.includes('INSERT INTO sale_items')) {
        const [id, userId, saleId, productId, quantity, unitPrice, unitCost] = params;
        writeRecords('sale_items', [...readRecords('sale_items'), { id, userId, saleId, productId, quantity, unitPrice, unitCost, syncedAt: null }]);
      } else if (sql.includes('INSERT INTO expenses')) {
        const [id, userId, title, amount, category, note, createdAt] = params;
        writeRecords('expenses', [...readRecords('expenses'), { id, userId, title, amount, category, note, syncedAt: null, createdAt }]);
      } else if (sql.includes('UPDATE expenses') && sql.includes('SET syncedAt')) {
        const [syncedAt, id] = params;
        writeRecords('expenses', readRecords('expenses').map((item) => item.id === id ? { ...item, syncedAt } : item));
      } else if (sql.includes('UPDATE expenses')) {
        const [title, amount, category, note, id, userId] = params;
        writeRecords('expenses', readRecords('expenses').map((item) => item.id === id && item.userId === userId ? { ...item, title, amount, category, note, syncedAt: null } : item));
      } else if (sql.includes('INSERT INTO debts')) {
        const [id, userId, customerName, description, amount, amountPaid, dueDate, status, createdAt, updatedAt] = params;
        writeRecords('debts', [...readRecords('debts'), { id, userId, customerName, description, amount, amountPaid, dueDate, status, syncedAt: null, createdAt, updatedAt }]);
      } else if (sql.includes('UPDATE debts SET amountPaid')) {
        const [amountPaid, status, updatedAt, id, userId] = params;
        writeRecords('debts', readRecords('debts').map((item) => item.id === id && item.userId === userId ? { ...item, amountPaid, status, updatedAt, syncedAt: null } : item));
      } else if (sql.includes('UPDATE debts SET status')) {
        const [status, updatedAt, id, userId] = params;
        writeRecords('debts', readRecords('debts').map((item) => item.id === id && item.userId === userId ? { ...item, status, updatedAt, syncedAt: null } : item));
      } else if (sql.includes('UPDATE debts SET customerName')) {
        const [customerName, description, amount, dueDate, status, updatedAt, id, userId] = params;
        writeRecords('debts', readRecords('debts').map((item) => item.id === id && item.userId === userId ? { ...item, customerName, description, amount, dueDate, status, updatedAt, syncedAt: null } : item));
      } else if (sql.includes('UPDATE debts') && sql.includes('SET syncedAt')) {
        const [syncedAt, id] = params;
        writeRecords('debts', readRecords('debts').map((item) => item.id === id ? { ...item, syncedAt } : item));
      } else if (sql.includes('DELETE FROM debts')) {
        writeRecords('debts', readRecords('debts').filter((item) => !(item.id === params[0] && item.userId === params[1])));
      } else if (sql.includes('DELETE FROM expenses')) {
        writeRecords('expenses', readRecords('expenses').filter((item) => !(item.id === params[0] && item.userId === params[1])));
      } else if (sql.includes('UPDATE sales') && sql.includes('SET syncedAt')) {
        const [syncedAt, id] = params;
        writeRecords('sales', readRecords('sales').map((item) => item.id === id ? { ...item, syncedAt } : item));
      }
      return { changes, lastInsertRowid: 1, firstInsertRowid: 1 };
    },
    closeAsync: async () => {},
  };
}

export async function initializeDatabase(): Promise<SQLiteDatabase> {
  if (!dbInstance) dbInstance = createMockDatabase();
  return dbInstance;
}

export async function getDatabase(): Promise<SQLiteDatabase> { return initializeDatabase(); }
export async function closeDatabase(): Promise<void> { if (dbInstance) { await dbInstance.closeAsync(); dbInstance = null; } }