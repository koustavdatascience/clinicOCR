import { describe, expect, it } from "vitest";
import { extractStructuredPrescription } from "./prescriptionPipeline";
import sharp from "sharp";

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

  it("accepts a prescription-style image fixture as primary visual evidence", async () => {
    const handwrittenFixture = await sharp(Buffer.from(`
      <svg width="820" height="480" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#fbf8f0"/>
        <text x="64" y="84" font-size="34" font-family="cursive" fill="#1e3a8a">Rx</text>
        <text x="64" y="150" font-size="30" font-family="cursive" fill="#1e3a8a">Amoxicillin 500 mg</text>
        <text x="64" y="208" font-size="30" font-family="cursive" fill="#1e3a8a">1 tablet twice daily</text>
      </svg>
    `)).jpeg().toBuffer();

    const draft = await extractStructuredPrescription("OCR was unreadable", handwrittenFixture, "image/jpeg");
    expect(draft).toEqual(expect.objectContaining({
      correctedText: expect.any(String),
      summary: expect.any(String),
      medicines: expect.any(Array),
    }));
  }, 45_000);
});
