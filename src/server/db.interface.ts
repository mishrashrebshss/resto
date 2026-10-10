import type { DatabaseSchema } from './db';

export interface IDatabase {
  get<K extends keyof DatabaseSchema>(key: K): DatabaseSchema[K];
  set<K extends keyof DatabaseSchema>(key: K, value: DatabaseSchema[K]): void;
  update(fn: (data: DatabaseSchema) => void): void;
  getAllData(): DatabaseSchema;
  importBackup(imported: unknown): { success: boolean; message: string; restaurantCount: number };
  resetToDefaults(): void;
  save(): void;
  checkSupabase(): Promise<{
    configured: boolean;
    connected: boolean;
    tables: Record<string, boolean>;
    allReady: boolean;
    cloudStoreReady: boolean;
    message: string;
    projectUrl: string;
  }>;
  syncToSupabase(): Promise<{ success: boolean; message: string; synced: Record<string, number> }>;
  syncFromSupabase(): Promise<{ success: boolean; message: string; restoredCount: number }>;
  lastSyncTime: string | null;
  lastSyncStatus: string;
  isCloudConfigured: boolean;
}
