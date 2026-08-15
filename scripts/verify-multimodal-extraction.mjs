import fs from "node:fs/promises";
import path from "node:path";
import { extractStructuredPrescription } from "../backend/prescriptionPipeline.ts";

const imagePath = process.argv[2];
const rawOcr = process.argv[3] ?? "Raw OCR was incomplete. Use the image as the primary evidence.";
if (!imagePath) throw new Error("Usage: node scripts/verify-multimodal-extraction.mjs <image-path> [raw-ocr]");

const source = await fs.readFile(imagePath);
const extension = path.extname(imagePath).toLowerCase();
const mimeType = extension === ".png" ? "image/png" : "image/jpeg";
const draft = await extractStructuredPrescription(rawOcr, source, mimeType);

console.log(JSON.stringify({
  correctedText: draft.correctedText,
  summary: draft.summary,
  medicines: draft.medicines,
  importantFindings: draft.importantFindings,
  tags: draft.tags,
}, null, 2));
