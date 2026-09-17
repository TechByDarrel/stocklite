import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { getDatabase, getActiveUserId } from '@/db/database';
import NetInfo from '@react-native-community/netinfo';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

type SyncListener = (status: SyncStatus, lastSyncedAt: string | null) => void;

let currentStatus: SyncStatus = 'idle';
let lastSyncedAt: string | null = null;
const listeners: SyncListener[] = [];

function notify() {
  listeners.forEach((listener) => listener(currentStatus, lastSyncedAt));
}

export function onSyncStatusChange(listener: SyncListener): () => void {
  listeners.push(listener);
  listener(currentStatus, lastSyncedAt);
  return () => {
    const index = listeners.indexOf(listener);
    if (index >= 0) listeners.splice(index, 1);
  };
}

async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return Boolean(state.isConnected && state.isInternetReachable !== false);
}

async function getFirebaseUid(localUserId: string): Promise<string | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ firebaseUid: string | null }>(
    `SELECT firebaseUid FROM users WHERE id = ?`,
    [localUserId]
  );
  return row?.firebaseUid || null;
}

async function pushTable(localUserId: string, firebaseUid: string, tableName: string, collectionName: string, ownerColumn: 'userId' | 'ownerId') {
  const database = await getDatabase();
  const unsyncedRows = await database.getAllAsync<Record<string, any>>(
    `SELECT * FROM ${tableName} WHERE ${ownerColumn} = ? AND syncedAt IS NULL`,
    [localUserId]
  );

  for (const row of unsyncedRows) {
    const docRef = doc(collection(db, 'users', firebaseUid, collectionName), row.id);
    await setDoc(docRef, row, { merge: true });
    await database.runAsync(`UPDATE ${tableName} SET syncedAt = ? WHERE id = ?`, [
      new Date().toISOString(),
      row.id,
    ]);
  }

  return unsyncedRows.length;
}

export async function syncNow(): Promise<{ success: boolean; pushedCount: number }> {
  const localUserId = getActiveUserId();
  if (!localUserId || localUserId === 'anonymous') {
    return { success: false, pushedCount: 0 };
  }

  const online = await isOnline();
  if (!online) {
    currentStatus = 'offline';
    notify();
    return { success: false, pushedCount: 0 };
  }

  const firebaseUid = await getFirebaseUid(localUserId);
  if (!firebaseUid) {
    // No Firebase account linked yet (e.g. signup/login's Firebase step
    // failed while offline last time). Nothing to sync until next
    // successful login re-attempts linking.
    currentStatus = 'idle';
    notify();
    return { success: false, pushedCount: 0 };
  }

  currentStatus = 'syncing';
  notify();

  try {
       let totalPushed = 0;
    totalPushed += await pushTable(localUserId, firebaseUid, 'products', 'products', 'ownerId');
    totalPushed += await pushTable(localUserId, firebaseUid, 'expenses', 'expenses', 'userId');
    totalPushed += await pushTable(localUserId, firebaseUid, 'debts', 'debts', 'userId');
    totalPushed += await pushTable(localUserId, firebaseUid, 'sales', 'sales', 'userId');

    currentStatus = 'synced';
    lastSyncedAt = new Date().toISOString();
    notify();
    return { success: true, pushedCount: totalPushed };
  } catch (error) {
    console.error('Sync failed:', error);
    currentStatus = 'error';
    notify();
    return { success: false, pushedCount: 0 };
  }
}

export function startAutoSync(intervalMs: number = 30000): () => void {
  syncNow();

  const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable !== false) {
      syncNow();
    }
  });

  const interval = setInterval(() => {
    syncNow();
  }, intervalMs);

  return () => {
    unsubscribeNetInfo();
    clearInterval(interval);
  };
}