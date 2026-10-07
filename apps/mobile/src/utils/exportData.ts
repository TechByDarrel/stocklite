import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { getDatabase, getActiveUserId } from '@/db/database';

export async function exportAllData(): Promise<void> {
  const db = await getDatabase();
  const userId = getActiveUserId();

  const [products, sales, expenses, debts] = await Promise.all([
    db.getAllAsync(`SELECT * FROM products WHERE ownerId = ?`, [userId]),
    db.getAllAsync(`SELECT * FROM sales WHERE userId = ?`, [userId]),
    db.getAllAsync(`SELECT * FROM expenses WHERE userId = ?`, [userId]),
    db.getAllAsync(`SELECT * FROM debts WHERE userId = ?`, [userId]),
  ]);

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    app: 'StockLite',
    version: 1,
    data: { products, sales, expenses, debts },
  };

  const json = JSON.stringify(exportPayload, null, 2);
  const fileName = `stocklite-backup-${new Date().toISOString().slice(0, 10)}.json`;

  if (Platform.OS === 'web') {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return;
  }

  const fileUri = `${FileSystem.documentDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, json);

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, { mimeType: 'application/json', dialogTitle: 'Export StockLite data' });
  }
}