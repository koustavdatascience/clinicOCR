import { beforeEach, describe, expect, it } from "vitest";
import { clearDraft, readDraft, saveDraft, type PrescriptionDraft } from "./clinic";

const draft: PrescriptionDraft = {
  patientId: 7,
  originalFilename: "prescription.jpg",
  originalMimeType: "image/jpeg",
  imageKey: "clinicocr/original.jpg",
  imageUrl: "/manus-storage/clinicocr/original.jpg",
  rawOcr: "RAW OCR TEXT\n",
  correctedText: "Reviewed text",
  summary: "Reviewed summary",
  medicines: [{ name: "Possibly Amoxicillin", dosage: "", frequency: "" }],
  importantFindings: [],
  tags: ["Review"],
  ocrConfidence: 65,
  aiStatus: "complete",
};

beforeEach(() => {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "sessionStorage", {
    value: {
      setItem: (key: string, value: string) => values.set(key, value),
      getItem: (key: string) => values.get(key) ?? null,
      removeItem: (key: string) => values.delete(key),
    },
    configurable: true,
  });
});

describe("review draft lifecycle", () => {
  it("stores a review draft without creating a saved prescription record", () => {
    saveDraft(draft);
    expect(readDraft()).toEqual(draft);
  });

  it("removes the draft when a doctor explicitly discards it", () => {
    saveDraft(draft);
    clearDraft();
    expect(readDraft()).toBeNull();
  });
});
