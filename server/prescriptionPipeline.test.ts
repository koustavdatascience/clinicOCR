import { describe, expect, it } from "vitest";
import {
  decodePrescriptionUpload,
  extractStructuredPrescription,
  normalizeUncertainMedicineName,
  toStructuredDraft,
} from "./prescriptionPipeline";
import { afterEach, vi } from "vitest";

afterEach(() => vi.unstubAllGlobals());

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

  it("sends the original image and verbatim raw OCR as separate Gemini evidence parts", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: JSON.stringify({ corrected_text: "Reviewed", summary: "Review", medicines: [], important_findings: [], tags: [] }) }] } }],
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await extractStructuredPrescription("RAW OCR\nUNCHANGED", Buffer.from("source-image"), "image/png");

    const request = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string);
    expect(request.contents[0].parts).toEqual(expect.arrayContaining([
      expect.objectContaining({ text: expect.stringContaining("RAW OCR\nUNCHANGED") }),
      { inlineData: { mimeType: "image/png", data: Buffer.from("source-image").toString("base64") } },
    ]));
  });

  it("retries a transient primary-model failure with the same multimodal evidence on a fallback Flash model", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: "Temporarily overloaded" } }), { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: JSON.stringify({ corrected_text: "Image reviewed", summary: "Fallback review", medicines: [], important_findings: [], tags: [] }) }] } }],
      }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const draft = await extractStructuredPrescription("RAW OCR\nUNCHANGED", Buffer.from("source-image"), "image/jpeg");

    expect(draft.correctedText).toBe("Image reviewed");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const fallbackRequest = JSON.parse(fetchMock.mock.calls[1]?.[1]?.body as string);
    expect(fallbackRequest.contents[0].parts).toEqual(expect.arrayContaining([
      expect.objectContaining({ text: expect.stringContaining("RAW OCR\nUNCHANGED") }),
      { inlineData: { mimeType: "image/jpeg", data: Buffer.from("source-image").toString("base64") } },
    ]));
  });

  it("continues to a fallback Flash model when the primary multimodal request times out", async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new DOMException("The operation was aborted due to timeout", "TimeoutError"))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: JSON.stringify({ corrected_text: "Fallback after timeout", summary: "Review", medicines: [], important_findings: [], tags: [] }) }] } }],
      }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const draft = await extractStructuredPrescription("RAW OCR", Buffer.from("source-image"), "image/jpeg");

    expect(draft.correctedText).toBe("Fallback after timeout");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
