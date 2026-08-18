export type DraftMedicine = { name: string; dosage: string; frequency: string };

export type PrescriptionDraft = {
  patientId: number;
  reviewImageUrl?: string | null;
  rawOcr: string;
  sourceLanguageCode?: string;
  sourceLanguageName?: string;
  sourceScript?: string;
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

/** Formats AI draft text for review without changing raw OCR evidence or clinical content. */
export function formatPrescriptionText(value: string) {
  let formatted = value.replace(/\r\n?/g, "\n").replace(/\s*\|\s*/g, "\n").trim();
  const labels = ["Date:", "Name:", "Age, Gender:", "Weight:", "Clinical Description:", "Advice:"];
  for (const label of labels) {
    const expression = new RegExp(`\\s*${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "gi");
    formatted = formatted.replace(expression, match => `\n${match.trim()}`);
  }
  formatted = formatted.replace(/([^\n])\s+(?=(?:SYP|TAB|CAP|INJ|DROP)\b)/gi, "$1\n");
  return formatted.replace(/^\n+|\n{3,}/g, match => match.startsWith("\n\n\n") ? "\n\n" : "").trim();
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
