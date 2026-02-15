import fs from 'node:fs';
import path from 'node:path';
import { db } from './index.js';

const seedFile = path.resolve(process.cwd(), 'migrations/002_seed.sql');
const sql = fs.readFileSync(seedFile, 'utf8');

db.exec(sql);
console.log('Seed complete.');
