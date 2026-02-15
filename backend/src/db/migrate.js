import fs from 'node:fs';
import path from 'node:path';
import { db } from './index.js';

const migrationsDir = path.resolve(process.cwd(), 'migrations');
const migrationFiles = fs
  .readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql') && file !== '002_seed.sql')
  .sort();

db.exec(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    filename TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

const appliedRows = db.prepare('SELECT filename FROM schema_migrations').all();
const appliedSet = new Set(appliedRows.map((row) => row.filename));
const markApplied = db.prepare('INSERT INTO schema_migrations (filename) VALUES (?)');

for (const file of migrationFiles) {
  if (appliedSet.has(file)) {
    console.log(`Skipped migration (already applied): ${file}`);
    continue;
  }

  const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
  db.exec(sql);
  markApplied.run(file);
  console.log(`Applied migration: ${file}`);
}

console.log('Migration complete.');
