import { Pool } from 'pg';

export const db = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'logistics',
  password: 'logistics',
  database: 'logistics',
});