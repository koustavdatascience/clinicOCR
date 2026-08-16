import sharp from "sharp";
import { createWorker } from "tesseract.js";
import { z } from "zod";
import type { Medicine } from "../drizzle/schema";
import { ENV } from "./_core/env";

const ACCEPTED_MIME_TYPES = new Set(["image/jpeg", "image/png"]);
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const GEMINI_MODELS = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-flash-lite-latest"] as const;

export type DecodedUpload = { buffer: Buffer; mimeType: "image/jpeg" | "image/png" };

export type StructuredPrescriptionDraft = {
  correctedText: string;
  summary: string;
  medicines: Medicine[];
  importantFindings: string[];
  tags: string[];
};

export type PrescriptionAnalysis = StructuredPrescriptionDraft & {
  rawOcr: string;
  ocrConfidence: number | null;
  aiStatus: "complete" | "unavailable";
  aiError?: string;
};

const structuredDraftSchema = z.object({
  corrected_text: z.string(),
  summary: z.string(),
  medicines: z.array(z.object({ name: z.string(), dosage: z.string(), frequency: z.string() })),
  important_findings: z.array(z.string()),
  tags: z.array(z.string()),
});

const GEMINI_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    corrected_text: { type: "string" },
    summary: { type: "string" },
    medicines: {
      type: "array",
      items: {
        type: "object",
        properties: { name: { type: "string" }, dosage: { type: "string" }, frequency: { type: "string" } },
        required: ["name", "dosage", "frequency"],
        additionalProperties: false,
      },
    },
    important_findings: { type: "array", items: { type: "string" } },
    tags: { type: "array", items: { type: "string" } },
  },
  required: ["corrected_text", "summary", "medicines", "important_findings", "tags"],
  additionalProperties: false,
} as const;

const EXTRACTION_INSTRUCTIONS = `You create a conservative, editable draft from handwritten-prescription OCR output. Return only JSON that follows the supplied schema. Never invent, infer, or normalize clinical facts that are not present in the raw OCR. Preserve unclear text. If any medicine or entity name is uncertain, prefix that name exactly with "Possibly " (including one trailing space). Do not diagnose, prescribe, or make treatment recommendations. Prefer empty fields over guesses.`;

export function decodePrescriptionUpload(dataUrl: string): DecodedUpload {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error("Please upload a JPG, JPEG, or PNG image.");
  const mimeType = match[1] as "image/jpeg" | "image/png";
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length || buffer.length > MAX_UPLOAD_BYTES) throw new Error("Upload must be an image smaller than 8 MB.");
  return { buffer, mimeType };
}

export function normalizeUncertainMedicineName(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return "";
  if (/^possibly\b/i.test(cleaned)) return `Possibly ${cleaned.replace(/^possibly\b\s*/i, "").trim()}`.trim();
  return cleaned;
}

export function toStructuredDraft(value: unknown): StructuredPrescriptionDraft {
  const parsed = structuredDraftSchema.parse(value);
  return {
    correctedText: parsed.corrected_text,
    summary: parsed.summary,
    medicines: parsed.medicines.map(medicine => ({
      name: normalizeUncertainMedicineName(medicine.name),
      dosage: medicine.dosage,
      frequency: medicine.frequency,
    })),
    importantFindings: parsed.important_findings,
    tags: parsed.tags,
  };
}

export async function preprocessPrescriptionImage(source: Buffer): Promise<Buffer> {
  const normalized = await sharp(source, { failOn: "none" })
    .rotate().resize({ width: 2400, withoutEnlargement: true, fit: "inside" }).grayscale().normalise()
    .clahe({ width: 8, height: 8, maxSlope: 3 }).median(3).raw().toBuffer({ resolveWithObject: true });
  const localMean = await sharp(normalized.data, { raw: { width: normalized.info.width, height: normalized.info.height, channels: normalized.info.channels } }).blur(12).raw().toBuffer();
  const thresholded = Buffer.alloc(normalized.data.length);
  for (let index = 0; index < normalized.data.length; index += normalized.info.channels) {
    thresholded[index] = normalized.data[index]! < localMean[index]! * 0.92 ? 0 : 255;
  }
  return sharp(thresholded, { raw: { width: normalized.info.width, height: normalized.info.height, channels: normalized.info.channels } }).sharpen().png().toBuffer();
}

export async function extractRawOcr(processedImage: Buffer): Promise<{ text: string; confidence: number | null }> {
  const worker = await createWorker("eng");
  try {
    const result = await worker.recognize(processedImage);
    return { text: result.data.text, confidence: Number.isFinite(result.data.confidence) ? Math.round(result.data.confidence) : null };
  } finally {
    await worker.terminate();
  }
}

export async function extractStructuredPrescription(rawOcr: string): Promise<StructuredPrescriptionDraft> {
  if (!ENV.geminiApiKey) throw new Error("The Gemini API key is not configured.");
  let lastError = "Gemini extraction was unavailable.";
  for (const model of GEMINI_MODELS) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(ENV.geminiApiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(30_000),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: EXTRACTION_INSTRUCTIONS }] },
          contents: [{ role: "user", parts: [{ text: `Raw OCR text follows. It may be incomplete or incorrect.\n\n${rawOcr}` }] }],
          generationConfig: { responseMimeType: "application/json", responseJsonSchema: GEMINI_RESPONSE_SCHEMA, temperature: 0 },
        }),
      },
    );
    const payload = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>; error?: { message?: string } };
    if (response.ok) {
      const content = payload.candidates?.[0]?.content?.parts?.map(part => part.text ?? "").join("\n");
      if (!content) throw new Error("Gemini returned an empty extraction response.");
      return toStructuredDraft(JSON.parse(content));
    }
    lastError = payload.error?.message || `Gemini extraction failed with status ${response.status}.`;
    if (response.status !== 429 && response.status !== 503) break;
  }
  throw new Error(lastError);
}

export async function analyzePrescriptionImage(source: Buffer): Promise<PrescriptionAnalysis> {
  const processedImage = await preprocessPrescriptionImage(source);
  const { text: rawOcr, confidence: ocrConfidence } = await extractRawOcr(processedImage);
  try {
    const draft = await extractStructuredPrescription(rawOcr);
    return { rawOcr, ocrConfidence, aiStatus: "complete", ...draft };
  } catch (error) {
    return { rawOcr, ocrConfidence, aiStatus: "unavailable", aiError: error instanceof Error ? error.message : "AI extraction was unavailable.", correctedText: "", summary: "", medicines: [], importantFindings: [], tags: [] };
  }
}
