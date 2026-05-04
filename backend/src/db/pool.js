import pg from 'pg';

const { Pool } = pg;

const DEFAULT_DATABASE_URL = 'postgres://iso_user:iso_password@localhost:5432/iso_testing_world';

export function createPool(connectionString = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL) {
  return new Pool({ connectionString });
}

export const pool = createPool();
