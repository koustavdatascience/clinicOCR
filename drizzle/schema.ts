import { relations } from "drizzle-orm";
import { bigint, boolean, index, integer, jsonb, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export type Medicine = { name: string; dosage: string; frequency: string };

export const userRole = pgEnum("clinic_user_role", ["user", "admin"]);

export const users = pgTable("clinic_users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("login_method", { length: 64 }),
  role: userRole("role").default("user").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in", { withTimezone: true }).defaultNow().notNull(),
});

export const patients = pgTable("clinic_patients", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  ownerId: integer("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 180 }).notNull(),
  age: integer("age"),
  gender: varchar("gender", { length: 48 }),
  phone: varchar("phone", { length: 40 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index("clinic_patients_owner_idx").on(table.ownerId),
  index("clinic_patients_owner_name_idx").on(table.ownerId, table.name),
  index("clinic_patients_owner_phone_idx").on(table.ownerId, table.phone),
]);

export const prescriptions = pgTable("clinic_prescriptions", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  ownerId: integer("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  patientId: bigint("patient_id", { mode: "number" }).notNull().references(() => patients.id, { onDelete: "cascade" }),
  imageKey: text("image_key").notNull(),
  imageUrl: text("image_url").notNull(),
  originalFilename: varchar("original_filename", { length: 255 }).notNull(),
  originalMimeType: varchar("original_mime_type", { length: 96 }).notNull(),
  rawOcr: text("raw_ocr").notNull(),
  sourceLanguageCode: varchar("source_language_code", { length: 24 }),
  sourceLanguageName: varchar("source_language_name", { length: 80 }),
  sourceScript: varchar("source_script", { length: 48 }),
  correctedText: text("corrected_text").notNull(),
  aiSummary: text("ai_summary").notNull(),
  medicines: jsonb("medicines").$type<Medicine[]>().notNull(),
  importantFindings: jsonb("important_findings").$type<string[]>().notNull(),
  tags: jsonb("tags").$type<string[]>().notNull(),
  doctorNotes: text("doctor_notes"),
  important: boolean("important").default(false).notNull(),
  ocrConfidence: integer("ocr_confidence"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index("clinic_prescriptions_owner_idx").on(table.ownerId),
  index("clinic_prescriptions_patient_created_idx").on(table.patientId, table.createdAt),
  index("clinic_prescriptions_owner_created_idx").on(table.ownerId, table.createdAt),
  index("clinic_prescriptions_patient_important_idx").on(table.patientId, table.important),
]);

export const patientRelations = relations(patients, ({ one, many }) => ({
  owner: one(users, { fields: [patients.ownerId], references: [users.id] }),
  prescriptions: many(prescriptions),
}));

export const prescriptionRelations = relations(prescriptions, ({ one }) => ({
  owner: one(users, { fields: [prescriptions.ownerId], references: [users.id] }),
  patient: one(patients, { fields: [prescriptions.patientId], references: [patients.id] }),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Patient = typeof patients.$inferSelect;
export type Prescription = typeof prescriptions.$inferSelect;
