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
      min: 1,
      idleTimeoutMillis: 300_000,
      connectionTimeoutMillis: 10_000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10_000,
    });
  }

  return pool;
}

export async function warmNeonConnection() {
  try {
    await getNeonPool().query("SELECT 1");
  } catch (error) {
    console.warn("[Database] Neon warmup did not complete:", error instanceof Error ? error.message : String(error));
  }
}
