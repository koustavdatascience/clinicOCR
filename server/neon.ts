import { Pool } from "pg";
import { ENV } from "./_core/env";

let pool: Pool | null = null;

export function getNeonPool() {
  if (!ENV.neonDatabaseUrl) {
    throw new Error("The Neon database connection is not configured.");
  }

  if (!pool) {
    pool = new Pool({
      connectionString: ENV.neonDatabaseUrl,
      max: 4,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 10_000,
    });
  }

  return pool;
}
