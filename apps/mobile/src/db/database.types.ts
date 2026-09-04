export interface SQLiteDatabase {
  execAsync(sql: string): Promise<void>;
  getAllAsync<T = any>(sql: string, ...params: any[]): Promise<T[]>;
  getFirstAsync<T = any>(sql: string, ...params: any[]): Promise<T | null>;
  runAsync(sql: string, ...params: any[]): Promise<any>;
  closeAsync(): Promise<void>;
}