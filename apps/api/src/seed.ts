import fs from 'node:fs';
import path from 'node:path';
import { db } from './db';

async function seed() {
  try {
    const seedPath = path.resolve('db/seed.sql');

    const sql = fs.readFileSync(seedPath, 'utf8');

    await db.query(sql);

    console.log('Seed completed successfully.');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

seed();