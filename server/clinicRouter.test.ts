import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./clinicDb", () => ({
  createPatient: vi.fn(),
  createPrescription: vi.fn(),
  deletePatient: vi.fn(),
  getDashboard: vi.fn(),
  getDuplicatePatient: vi.fn(),
  getPatient: vi.fn(),
  getPrescription: vi.fn(),
  listPatientPrescriptions: vi.fn(),
  listPatients: vi.fn(),
  searchPrescriptions: vi.fn(),
  updatePatient: vi.fn(),
  updatePrescriptionMeta: vi.fn(),
}));

vi.mock("./prescriptionPipeline", () => ({
  analyzePrescriptionImage: vi.fn(),
  decodePrescriptionUpload: vi.fn(() => ({ buffer: Buffer.from("image"), mimeType: "image/jpeg" })),
}));

import * as clinicDb from "./clinicDb";
import { clinicRouter } from "./clinicRouter";
import * as pipeline from "./prescriptionPipeline";

function createCaller() {
  const ctx = {
    user: {
      id: 42,
      openId: "doctor-42",
      name: "Dr. Rivera",
      email: "doctor@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {},
    res: {},
  } as unknown as TrpcContext;

  return clinicRouter.createCaller(ctx);
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(clinicDb.getPatient).mockResolvedValue({ id: 7, ownerId: 42, name: "Jordan Lee" } as never);
  vi.mocked(pipeline.decodePrescriptionUpload).mockReturnValue({ buffer: Buffer.from("image"), mimeType: "image/jpeg" });
});

describe("ClinicOCR procedure integration", () => {
  it("returns dashboard statistics only for the authenticated clinic user", async () => {
    const expected = { patientCount: 3, prescriptionCount: 5, recent: [] };
    vi.mocked(clinicDb.getDashboard).mockResolvedValue(expected);

    await expect(createCaller().dashboard()).resolves.toEqual(expected);
    expect(clinicDb.getDashboard).toHaveBeenCalledWith(42);
  });

  it("blocks a duplicate patient before creating a new record", async () => {
    vi.mocked(clinicDb.getDuplicatePatient).mockResolvedValue([{ id: 7, name: "Jordan Lee", phone: "5551001" }] as never);

    await expect(createCaller().patients.create({ name: "Jordan Lee", age: null, gender: null, phone: "5551001" })).rejects.toMatchObject({ code: "CONFLICT" });
    expect(clinicDb.createPatient).not.toHaveBeenCalled();
  });

  it("creates, updates, deletes, and searches patient records for the active clinic", async () => {
    vi.mocked(clinicDb.getDuplicatePatient).mockResolvedValue([] as never);
    vi.mocked(clinicDb.createPatient).mockResolvedValue({ id: 8, ownerId: 42, name: "Taylor Morgan" } as never);
    vi.mocked(clinicDb.updatePatient).mockResolvedValue({ id: 8, ownerId: 42, name: "Taylor Morgan", phone: "5552002" } as never);
    vi.mocked(clinicDb.deletePatient).mockResolvedValue(true);
    vi.mocked(clinicDb.listPatients).mockResolvedValue([{ id: 8, name: "Taylor Morgan", phone: "5552002" }] as never);

    await createCaller().patients.create({ name: "Taylor Morgan", age: 34, gender: "Female", phone: "5552002" });
    await createCaller().patients.update({ id: 7, patient: { name: "Taylor Morgan", age: 34, gender: "Female", phone: "5552002" } });
    await createCaller().patients.list({ query: "5552002" });
    await expect(createCaller().patients.delete({ id: 7 })).resolves.toEqual({ success: true });

    expect(clinicDb.createPatient).toHaveBeenCalledWith(42, expect.objectContaining({ name: "Taylor Morgan", phone: "5552002" }));
    expect(clinicDb.updatePatient).toHaveBeenCalledWith(42, 7, expect.objectContaining({ name: "Taylor Morgan" }));
    expect(clinicDb.listPatients).toHaveBeenCalledWith(42, "5552002");
    expect(clinicDb.deletePatient).toHaveBeenCalledWith(42, 7);
  });

  it("saves a reviewed prescription only through the explicit save procedure", async () => {
    const saved = { prescription: { id: 88 }, patient: { id: 7, name: "Jordan Lee" } };
    vi.mocked(clinicDb.createPrescription).mockResolvedValue(saved as never);

    await expect(createCaller().prescriptions.save({
      patientId: 7,
      rawOcr: "RAW\nOCR\n",
      correctedText: "Reviewed text",
      aiSummary: "Reviewed summary",
      medicines: [{ name: "Possibly Amoxicillin", dosage: "", frequency: "" }],
      importantFindings: [],
      tags: ["Review"],
      doctorNotes: "Follow up",
      important: true,
      ocrConfidence: 62,
    })).resolves.toEqual(saved);

    expect(clinicDb.createPrescription).toHaveBeenCalledWith(42, expect.objectContaining({ rawOcr: "RAW\nOCR\n", important: true }));
    expect(clinicDb.createPrescription).toHaveBeenCalledWith(42, expect.not.objectContaining({ imageKey: expect.anything(), imageUrl: expect.anything() }));
  });

  it("keeps analysis as an unsaved draft and does not create a prescription", async () => {
    vi.mocked(pipeline.analyzePrescriptionImage).mockResolvedValue({
      rawOcr: "raw output",
      correctedText: "draft",
      summary: "draft summary",
      medicines: [],
      importantFindings: [],
      tags: [],
      ocrConfidence: 70,
      aiStatus: "complete",
    });

    const draft = await createCaller().prescriptions.analyze({
      patientId: 7,
      filename: "original.jpg",
      dataUrl: "data:image/jpeg;base64,aGVsbG9oZWxsb2hlbGxvaGVsbG9oZWxsbw==",
    });

    expect(draft.rawOcr).toBe("raw output");
    expect(draft).not.toHaveProperty("imageKey");
    expect(draft).not.toHaveProperty("imageUrl");
    expect(clinicDb.createPrescription).not.toHaveBeenCalled();
  });

  it("applies deterministic search inputs and Phase 2 record metadata updates", async () => {
    vi.mocked(clinicDb.searchPrescriptions).mockResolvedValue([] as never);
    vi.mocked(clinicDb.updatePrescriptionMeta).mockResolvedValue({ prescription: { id: 88 } } as never);

    await createCaller().prescriptions.search({ patient: "Jordan", medicine: "Amoxicillin" });
    await createCaller().prescriptions.updateMeta({ id: 88, important: true, doctorNotes: "Review in five days" });

    expect(clinicDb.searchPrescriptions).toHaveBeenCalledWith(42, expect.objectContaining({ patient: "Jordan", medicine: "Amoxicillin" }));
    expect(clinicDb.updatePrescriptionMeta).toHaveBeenCalledWith(42, 88, { important: true, doctorNotes: "Review in five days" });
  });
});
