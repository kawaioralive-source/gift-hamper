import { execFileSync } from 'child_process';
import path from 'path';

export async function querySqlite<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  try {
    const dbPath = path.join(process.cwd(), 'gifthampers.db');
    const bridgePath = path.join(process.cwd(), 'src', 'lib', 'sqlite_bridge.py');
    const stdout = execFileSync('python', [bridgePath, dbPath, sql, JSON.stringify(params)], {
      encoding: 'utf-8',
      timeout: 5000,
    });
    return JSON.parse(stdout.trim());
  } catch (error) {
    console.error('SQLite query error:', error);
    return [];
  }
}

export async function executeSqlite(sql: string, params: any[] = []): Promise<{ success: boolean; lastrowid?: number }> {
  try {
    const dbPath = path.join(process.cwd(), 'gifthampers.db');
    const bridgePath = path.join(process.cwd(), 'src', 'lib', 'sqlite_bridge.py');
    const stdout = execFileSync('python', [bridgePath, dbPath, sql, JSON.stringify(params)], {
      encoding: 'utf-8',
      timeout: 5000,
    });
    const res = JSON.parse(stdout.trim());
    return res;
  } catch (error) {
    console.error('SQLite execute error:', error);
    return { success: false };
  }
}
