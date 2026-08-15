import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getUserByOpenId, upsertUser } from "./db";
import { clinicRouter } from "./clinicRouter";
import { getNeonPool } from "./neon";
import type { TrpcContext } from "./_core/context";

const testOpenId = `clinicocr-e2e-${Date.now()}-${Math.random().toString(16).slice(2)}`;
let caller: ReturnType<typeof clinicRouter.createCaller>;

beforeAll(async () => {
  await upsertUser({ openId: testOpenId, name: "ClinicOCR Verification", email: null, loginMethod: "test", role: "user" });
  const user = await getUserByOpenId(testOpenId);
  if (!user) throw new Error("Unable to initialize the isolated ClinicOCR workflow user.");
  const ctx = { user, req: {}, res: {} } as unknown as TrpcContext;
  caller = clinicRouter.createCaller(ctx);
}, 20_000);

afterAll(async () => {
  await getNeonPool().query("DELETE FROM clinic_users WHERE open_id = $1", [testOpenId]);
}, 20_000);

describe("ClinicOCR live Neon workflow", () => {
  it("persists a doctor-approved draft, exposes it in history and search, updates metadata, then cascades cleanup", async () => {
    const patient = await caller.patients.create({ name: "Verification Patient", age: 40, gender: "Unspecified", phone: "0000000000" });
    expect(patient?.id).toBeTypeOf("number");

    const saved = await caller.prescriptions.save({
      patientId: patient!.id,
      rawOcr: "VERIFICATION RAW OCR\nUNCHANGED",
      sourceLanguageCode: "hi",
      sourceLanguageName: "Hindi",
      sourceScript: "Devanagari",
      correctedText: "Verification reviewed text",
      aiSummary: "Verification summary",
      medicines: [{ name: "Possibly Verification Medicine", dosage: "500 mg", frequency: "daily" }],
      importantFindings: [],
      tags: ["Verification"],
      doctorNotes: null,
      important: false,
      ocrConfidence: 77,
    });

    expect(saved?.prescription.rawOcr).toBe("VERIFICATION RAW OCR\nUNCHANGED");
    expect(saved?.prescription.imageUrl).toBeNull();
    expect(saved?.prescription.sourceLanguageCode).toBe("hi");
    expect(saved?.prescription.sourceLanguageName).toBe("Hindi");
    expect(saved?.prescription.sourceScript).toBe("Devanagari");
    const prescriptionId = saved!.prescription.id;

    const history = await caller.prescriptions.forPatient({ patientId: patient!.id });
    expect(history.map(record => record.id)).toContain(prescriptionId);

    await caller.prescriptions.updateMeta({ id: prescriptionId, important: true, doctorNotes: "Verification follow-up" });
    const results = await caller.prescriptions.search({ patient: "Verification Patient", medicine: "Verification Medicine" });
    expect(results.map(record => record.id)).toContain(prescriptionId);

    await expect(caller.patients.delete({ id: patient!.id })).resolves.toEqual({ success: true });
    const remaining = await getNeonPool().query<{ count: string }>("SELECT COUNT(*)::text AS count FROM clinic_prescriptions WHERE id = $1", [prescriptionId]);
    expect(remaining.rows[0]?.count).toBe("0");
  }, 30_000);
});
