import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const connectionString = process.env.NEON_DATABASE_URL;
if (!connectionString) throw new Error("NEON_DATABASE_URL is required to apply ClinicOCR migrations.");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "drizzle", "neon-migrations");
const migrations = (await fs.readdir(root)).filter(file => file.endsWith(".sql")).sort();
const client = new Client({ connectionString });

try {
  await client.connect();
  await client.query(`CREATE TABLE IF NOT EXISTS clinicocr_schema_migrations (id TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  const applied = new Set((await client.query("SELECT id FROM clinicocr_schema_migrations")).rows.map(row => row.id));
  for (const migration of migrations) {
    if (applied.has(migration)) continue;
    const sql = await fs.readFile(path.join(root, migration), "utf8");
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("INSERT INTO clinicocr_schema_migrations (id) VALUES ($1)", [migration]);
      await client.query("COMMIT");
      console.log(`Applied ${migration}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
  console.log("ClinicOCR Neon migrations are current.");
} finally {
  await client.end().catch(() => undefined);
}
