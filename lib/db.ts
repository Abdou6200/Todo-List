import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function getConnection() {
  return pool;
}

export async function query(text: string, params?: any[]) {
  const result = await pool.query(text, params);
  return result;
}

export async function closeConnection() {
  await pool.end();
}
