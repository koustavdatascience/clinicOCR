import { describe, expect, it } from "vitest";
import { extractStructuredPrescription } from "./prescriptionPipeline";

describe("Gemini prescription extraction", () => {
  it("returns a conservative structured draft for raw OCR text", async () => {
    const draft = await extractStructuredPrescription("Rx: Amoxicillin 500 mg, twice daily. Patient follow-up if symptoms continue.");

    expect(draft).toEqual(expect.objectContaining({
      correctedText: expect.any(String),
      summary: expect.any(String),
      medicines: expect.any(Array),
      importantFindings: expect.any(Array),
      tags: expect.any(Array),
    }));
    draft.medicines.forEach(medicine => {
      expect(medicine).toEqual(expect.objectContaining({ name: expect.any(String), dosage: expect.any(String), frequency: expect.any(String) }));
    });
  }, 45_000);
});
