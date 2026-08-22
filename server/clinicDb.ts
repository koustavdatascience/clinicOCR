import type { Medicine } from "../drizzle/schema";
import { getNeonPool } from "./neon";

export type PatientInput = {
  name: string;
  age?: number | null;
  gender?: string | null;
  phone?: string | null;
};

export type PrescriptionInput = {
  patientId: number;
  imageKey: string;
  imageUrl: string;
  originalFilename: string;
  originalMimeType: string;
  rawOcr: string;
  sourceLanguageCode?: string | null;
  sourceLanguageName?: string | null;
  sourceScript?: string | null;
  correctedText: string;
  aiSummary: string;
  medicines: Medicine[];
  importantFindings: string[];
  tags: string[];
  doctorNotes?: string | null;
  important?: boolean;
  ocrConfidence?: number | null;
};

type Row = Record<string, unknown>;

async function query<T extends Row = Row>(text: string, values: unknown[] = []) {
  return (await getNeonPool().query<T>(text, values)).rows;
}

function asDate(value: unknown) {
  return value instanceof Date ? value : new Date(String(value));
}

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function mapPatient(row: Row) {
  return {
    id: Number(row.id),
    ownerId: Number(row.owner_id),
    name: String(row.name),
    age: row.age === null || row.age === undefined ? null : Number(row.age),
    gender: row.gender === null || row.gender === undefined ? null : String(row.gender),
    phone: row.phone === null || row.phone === undefined ? null : String(row.phone),
    createdAt: asDate(row.created_at),
    updatedAt: asDate(row.updated_at),
  };
}

function mapPrescription(row: Row) {
  return {
    id: Number(row.id),
    ownerId: Number(row.owner_id),
    patientId: Number(row.patient_id),
    imageKey: String(row.image_key),
    imageUrl: String(row.image_url),
    originalFilename: String(row.original_filename),
    originalMimeType: String(row.original_mime_type),
    rawOcr: String(row.raw_ocr),
    sourceLanguageCode: row.source_language_code === null || row.source_language_code === undefined ? null : String(row.source_language_code),
    sourceLanguageName: row.source_language_name === null || row.source_language_name === undefined ? null : String(row.source_language_name),
    sourceScript: row.source_script === null || row.source_script === undefined ? null : String(row.source_script),
    correctedText: String(row.corrected_text),
    aiSummary: String(row.ai_summary),
    medicines: asArray<Medicine>(row.medicines),
    importantFindings: asArray<string>(row.important_findings),
    tags: asArray<string>(row.tags),
    doctorNotes: row.doctor_notes === null || row.doctor_notes === undefined ? null : String(row.doctor_notes),
    important: Boolean(row.important),
    ocrConfidence: row.ocr_confidence === null || row.ocr_confidence === undefined ? null : Number(row.ocr_confidence),
    createdAt: asDate(row.created_at),
    updatedAt: asDate(row.updated_at),
  };
}

export async function getDashboard(ownerId: number) {
  const [countRows, recent] = await Promise.all([
    query<{ patient_count: string; prescription_count: string }>(
      `SELECT
        (SELECT COUNT(*) FROM clinic_patients WHERE owner_id = $1) AS patient_count,
        (SELECT COUNT(*) FROM clinic_prescriptions WHERE owner_id = $1) AS prescription_count`,
      [ownerId],
    ),
    query<Row>(
      `SELECT p.id, p.patient_id, patient.name AS patient_name, p.image_url, p.tags, p.important, p.created_at
       FROM clinic_prescriptions p
       INNER JOIN clinic_patients patient ON patient.id = p.patient_id
       WHERE p.owner_id = $1
       ORDER BY p.created_at DESC
       LIMIT 6`,
      [ownerId],
    ),
  ]);
  const [counts] = countRows;
  return {
    patientCount: Number(counts?.patient_count ?? 0),
    prescriptionCount: Number(counts?.prescription_count ?? 0),
    recent: recent.map(row => ({
      id: Number(row.id),
      patientId: Number(row.patient_id),
      patientName: String(row.patient_name),
      imageUrl: String(row.image_url),
      tags: asArray<string>(row.tags),
      important: Boolean(row.important),
      createdAt: asDate(row.created_at),
    })),
  };
}

export async function listPatients(ownerId: number, search?: string) {
  const cleanSearch = search?.trim();
  const values: unknown[] = [ownerId];
  let filter = "p.owner_id = $1";
  if (cleanSearch) {
    values.push(`%${cleanSearch}%`);
    filter += ` AND (p.name ILIKE $${values.length} OR COALESCE(p.phone, '') ILIKE $${values.length})`;
  }
  const rows = await query<Row>(
    `SELECT p.*, COUNT(pr.id)::int AS prescription_count
     FROM clinic_patients p
     LEFT JOIN clinic_prescriptions pr ON pr.patient_id = p.id
     WHERE ${filter}
     GROUP BY p.id
     ORDER BY p.updated_at DESC`,
    values,
  );
  return rows.map(row => ({ ...mapPatient(row), prescriptionCount: Number(row.prescription_count ?? 0) }));
}

export async function getPatient(ownerId: number, patientId: number) {
  const [row] = await query<Row>(
    "SELECT * FROM clinic_patients WHERE owner_id = $1 AND id = $2 LIMIT 1",
    [ownerId, patientId],
  );
  return row ? mapPatient(row) : null;
}

export async function getDuplicatePatient(ownerId: number, input: PatientInput, excludeId?: number) {
  const values: unknown[] = [ownerId, input.name.trim()];
  const criteria = ["LOWER(name) = LOWER($2)"];
  if (input.phone?.trim()) {
    values.push(input.phone.trim());
    criteria.push(`phone = $${values.length}`);
  }
  let filter = `owner_id = $1 AND (${criteria.join(" OR ")})`;
  if (excludeId) {
    values.push(excludeId);
    filter += ` AND id <> $${values.length}`;
  }
  const rows = await query<Row>(`SELECT id, name, phone FROM clinic_patients WHERE ${filter} LIMIT 3`, values);
  return rows.map(row => ({ id: Number(row.id), name: String(row.name), phone: row.phone === null ? null : String(row.phone) }));
}

export async function createPatient(ownerId: number, input: PatientInput) {
  const [row] = await query<Row>(
    `INSERT INTO clinic_patients (owner_id, name, age, gender, phone)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [ownerId, input.name.trim(), input.age ?? null, input.gender?.trim() || null, input.phone?.trim() || null],
  );
  return row ? mapPatient(row) : null;
}

export async function updatePatient(ownerId: number, patientId: number, input: PatientInput) {
  const [row] = await query<Row>(
    `UPDATE clinic_patients
     SET name = $3, age = $4, gender = $5, phone = $6, updated_at = NOW()
     WHERE owner_id = $1 AND id = $2
     RETURNING *`,
    [ownerId, patientId, input.name.trim(), input.age ?? null, input.gender?.trim() || null, input.phone?.trim() || null],
  );
  return row ? mapPatient(row) : null;
}

export async function deletePatient(ownerId: number, patientId: number) {
  const rows = await query<Row>("DELETE FROM clinic_patients WHERE owner_id = $1 AND id = $2 RETURNING id", [ownerId, patientId]);
  return rows.length > 0;
}

export async function listPatientPrescriptions(ownerId: number, patientId: number) {
  const rows = await query<Row>(
    `SELECT id, image_url, ai_summary, tags, important, created_at
     FROM clinic_prescriptions
     WHERE owner_id = $1 AND patient_id = $2
     ORDER BY important DESC, created_at DESC`,
    [ownerId, patientId],
  );
  return rows.map(row => ({
    id: Number(row.id),
    imageUrl: String(row.image_url),
    aiSummary: String(row.ai_summary),
    tags: asArray<string>(row.tags),
    important: Boolean(row.important),
    createdAt: asDate(row.created_at),
  }));
}

export async function getPrescription(ownerId: number, prescriptionId: number) {
  const [row] = await query<Row>(
    `SELECT pr.*, patient.id AS patient_record_id, patient.name AS patient_record_name,
      patient.age AS patient_record_age, patient.gender AS patient_record_gender, patient.phone AS patient_record_phone
     FROM clinic_prescriptions pr
     INNER JOIN clinic_patients patient ON patient.id = pr.patient_id
     WHERE pr.owner_id = $1 AND pr.id = $2
     LIMIT 1`,
    [ownerId, prescriptionId],
  );
  if (!row) return null;
  return {
    prescription: mapPrescription(row),
    patient: {
      id: Number(row.patient_record_id),
      name: String(row.patient_record_name),
      age: row.patient_record_age === null ? null : Number(row.patient_record_age),
      gender: row.patient_record_gender === null ? null : String(row.patient_record_gender),
      phone: row.patient_record_phone === null ? null : String(row.patient_record_phone),
    },
  };
}

export async function createPrescription(ownerId: number, input: PrescriptionInput) {
  const [row] = await query<Row>(
    `INSERT INTO clinic_prescriptions (
      owner_id, patient_id, image_key, image_url, original_filename, original_mime_type,
      raw_ocr, source_language_code, source_language_name, source_script,
      corrected_text, ai_summary, medicines, important_findings, tags,
      doctor_notes, important, ocr_confidence
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14::jsonb, $15::jsonb, $16, $17, $18)
    RETURNING id`,
    [
      ownerId, input.patientId, input.imageKey, input.imageUrl, input.originalFilename, input.originalMimeType,
      input.rawOcr, input.sourceLanguageCode ?? null, input.sourceLanguageName ?? null, input.sourceScript ?? null,
      input.correctedText, input.aiSummary, JSON.stringify(input.medicines), JSON.stringify(input.importantFindings),
      JSON.stringify(input.tags), input.doctorNotes ?? null, input.important ?? false, input.ocrConfidence ?? null,
    ],
  );
  return row ? getPrescription(ownerId, Number(row.id)) : null;
}

export async function updatePrescriptionMeta(
  ownerId: number,
  prescriptionId: number,
  input: { doctorNotes?: string | null; important?: boolean; tags?: string[] },
) {
  const values: unknown[] = [];
  const assignments: string[] = [];
  if (input.doctorNotes !== undefined) {
    values.push(input.doctorNotes);
    assignments.push(`doctor_notes = $${values.length}`);
  }
  if (input.important !== undefined) {
    values.push(input.important);
    assignments.push(`important = $${values.length}`);
  }
  if (input.tags !== undefined) {
    values.push(JSON.stringify(input.tags));
    assignments.push(`tags = $${values.length}::jsonb`);
  }
  if (assignments.length) {
    values.push(ownerId, prescriptionId);
    await query(
      `UPDATE clinic_prescriptions SET ${assignments.join(", ")}, updated_at = NOW()
       WHERE owner_id = $${values.length - 1} AND id = $${values.length}`,
      values,
    );
  }
  return getPrescription(ownerId, prescriptionId);
}

export async function searchPrescriptions(
  ownerId: number,
  input: { patient?: string; medicine?: string; from?: Date; to?: Date },
) {
  const values: unknown[] = [ownerId];
  const filters = ["pr.owner_id = $1"];
  if (input.patient?.trim()) {
    values.push(`%${input.patient.trim()}%`);
    filters.push(`(patient.name ILIKE $${values.length} OR COALESCE(patient.phone, '') ILIKE $${values.length})`);
  }
  if (input.medicine?.trim()) {
    values.push(`%${input.medicine.trim()}%`);
    filters.push(`pr.medicines::text ILIKE $${values.length}`);
  }
  if (input.from) {
    values.push(input.from);
    filters.push(`pr.created_at >= $${values.length}`);
  }
  if (input.to) {
    values.push(input.to);
    filters.push(`pr.created_at <= $${values.length}`);
  }
  const rows = await query<Row>(
    `SELECT pr.id, pr.patient_id, patient.name AS patient_name, pr.image_url, pr.tags, pr.important, pr.medicines, pr.created_at
     FROM clinic_prescriptions pr
     INNER JOIN clinic_patients patient ON patient.id = pr.patient_id
     WHERE ${filters.join(" AND ")}
     ORDER BY pr.important DESC, pr.created_at DESC`,
    values,
  );
  return rows.map(row => ({
    id: Number(row.id),
    patientId: Number(row.patient_id),
    patientName: String(row.patient_name),
    imageUrl: String(row.image_url),
    tags: asArray<string>(row.tags),
    important: Boolean(row.important),
    medicines: asArray<Medicine>(row.medicines),
    createdAt: asDate(row.created_at),
  }));
}
