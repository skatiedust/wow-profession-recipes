import { Pool, PoolConfig } from "pg";

const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  // Cloud SQL connections via Unix socket can be slow to establish
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10,
};

if (process.env.NODE_ENV === "production") {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

pool.on("error", (err) => {
  console.error("Unexpected error on idle database client", err);
});

export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<import("pg").QueryResult<T>> {
  return pool.query<T>(text, params);
}

export async function getClient() {
  return pool.connect();
}

export async function closePool(): Promise<void> {
  await pool.end();
}

export default pool;
