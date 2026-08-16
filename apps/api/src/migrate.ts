import fs from 'node:fs';
import path from 'node:path';
import { db } from './db';

async function migrate() {
  try {
    const migrationsDir = path.resolve('db/migrations');

    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      const migrationPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationPath, 'utf8');

      console.log(`Running migration: ${file}`);

      await db.query(sql);
    }

    console.log('Migrations completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

migrate();