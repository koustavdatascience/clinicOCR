import type { InsertUser } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { getNeonPool } from "./neon";

type UserRow = {
  id: number;
  open_id: string;
  name: string | null;
  email: string | null;
  login_method: string | null;
  role: "user" | "admin";
  created_at: Date;
  updated_at: Date;
  last_signed_in: Date;
};

function mapUser(row: UserRow) {
  return {
    id: Number(row.id),
    openId: row.open_id,
    name: row.name,
    email: row.email,
    loginMethod: row.login_method,
    role: row.role,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    lastSignedIn: new Date(row.last_signed_in),
  };
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  const lastSignedIn = user.lastSignedIn ?? new Date();
  await getNeonPool().query(
    `INSERT INTO clinic_users (open_id, name, email, login_method, role, last_signed_in)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (open_id) DO UPDATE SET
       name = COALESCE(EXCLUDED.name, clinic_users.name),
       email = COALESCE(EXCLUDED.email, clinic_users.email),
       login_method = COALESCE(EXCLUDED.login_method, clinic_users.login_method),
       role = EXCLUDED.role,
       last_signed_in = EXCLUDED.last_signed_in,
       updated_at = NOW()`,
    [user.openId, user.name ?? null, user.email ?? null, user.loginMethod ?? null, role, lastSignedIn],
  );
}

export async function getUserByOpenId(openId: string) {
  const result = await getNeonPool().query<UserRow>(
    "SELECT * FROM clinic_users WHERE open_id = $1 LIMIT 1",
    [openId],
  );
  return result.rows[0] ? mapUser(result.rows[0]) : undefined;
}
