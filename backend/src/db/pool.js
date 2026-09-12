import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

// Supabase (and most managed Postgres) requires SSL, but the cert chain
// often isn't in Node's default trust store, so we relax verification.
// This is fine for a class project talking to your own Supabase instance.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client', err);
});
