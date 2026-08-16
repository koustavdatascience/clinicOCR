import { describe, expect, it } from "vitest";
import {
  decodePrescriptionUpload,
  normalizeUncertainMedicineName,
  toStructuredDraft,
} from "./prescriptionPipeline";

describe("prescription upload validation", () => {
  it("accepts an allowed PNG data URL", () => {
    const upload = decodePrescriptionUpload("data:image/png;base64,aGVsbG8=");
    expect(upload.mimeType).toBe("image/png");
    expect(upload.buffer.toString()).toBe("hello");
  });

  it("rejects unsupported upload types", () => {
    expect(() => decodePrescriptionUpload("data:image/gif;base64,aGVsbG8=")).toThrow(
      "JPG, JPEG, or PNG",
    );
  });
});

describe("prescription extraction safeguards", () => {
  it("normalizes uncertain medicine labels to the exact Possibly prefix", () => {
    expect(normalizeUncertainMedicineName("possibly amoxicillin")).toBe("Possibly amoxicillin");
    expect(normalizeUncertainMedicineName("Amoxicillin")).toBe("Amoxicillin");
  });

  it("preserves structured fields while normalizing uncertain medicine names", () => {
    const draft = toStructuredDraft({
      corrected_text: "Raw draft",
      summary: "Review required",
      medicines: [{ name: "POSSIBLY Levolin", dosage: "", frequency: "" }],
      important_findings: [],
      tags: ["Review"],
    });
    expect(draft.medicines[0]?.name).toBe("Possibly Levolin");
    expect(draft.correctedText).toBe("Raw draft");
  });
});
