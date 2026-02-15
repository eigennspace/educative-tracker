import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { env } from '../config/env.js';

const absoluteDbPath = path.resolve(process.cwd(), env.dbPath);
const dbDir = path.dirname(absoluteDbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(absoluteDbPath);
db.pragma('foreign_keys = ON');

export function runInTransaction(handler) {
  const transaction = db.transaction(handler);
  return transaction();
}
