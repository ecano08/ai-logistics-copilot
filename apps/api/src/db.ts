import { Pool } from 'pg';

export const db = new Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? 'logistics',
  password: process.env.DB_PASSWORD ?? 'logistics',
  database: process.env.DB_NAME ?? 'logistics',
});