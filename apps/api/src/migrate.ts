import fs from 'node:fs';
import path from 'node:path';
import { db } from './db';

async function migrate() {
  try {
    const migrationPath = path.resolve(
      'db/migrations/001_create_logistics_domain.sql'
    );

    const sql = fs.readFileSync(migrationPath, 'utf8');

    await db.query(sql);

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

migrate();