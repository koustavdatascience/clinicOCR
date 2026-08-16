export type DraftMedicine = { name: string; dosage: string; frequency: string };

export type PrescriptionDraft = {
  patientId: number;
  originalFilename: string;
  originalMimeType: "image/jpeg" | "image/png";
  imageKey: string;
  imageUrl: string;
  rawOcr: string;
  correctedText: string;
  summary: string;
  medicines: DraftMedicine[];
  importantFindings: string[];
  tags: string[];
  ocrConfidence: number | null;
  aiStatus: "complete" | "unavailable";
  aiError?: string;
};

const DRAFT_KEY = "clinicocr-review-draft";

export function saveDraft(draft: PrescriptionDraft) {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function readDraft(): PrescriptionDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as PrescriptionDraft) : null;
  } catch {
    return null;
  }
}

export function clearDraft() {
  sessionStorage.removeItem(DRAFT_KEY);
}

export function formatDate(value: Date | string | number) {
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export function initials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join("")
    .toUpperCase();
}
