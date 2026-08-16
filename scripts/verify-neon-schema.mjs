import { Client } from "pg";

const connectionString = process.env.NEON_DATABASE_URL;
if (!connectionString) throw new Error("NEON_DATABASE_URL is required to validate ClinicOCR schema.");

const expectedTables = ["clinic_users", "clinic_patients", "clinic_prescriptions", "clinicocr_schema_migrations"];
const client = new Client({ connectionString });
try {
  await client.connect();
  const { rows } = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ANY($1::text[])`, [expectedTables]);
  const actual = new Set(rows.map(row => row.table_name));
  const missing = expectedTables.filter(table => !actual.has(table));
  if (missing.length) throw new Error(`Missing Neon tables: ${missing.join(", ")}`);
  console.log("ClinicOCR Neon schema validation passed.");
} finally {
  await client.end().catch(() => undefined);
}
