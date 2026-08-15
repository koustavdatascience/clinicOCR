// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import html2canvas from "html2canvas";

const toastMocks = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
const pdfOperations = vi.hoisted(() => ({ text: vi.fn(), rect: vi.fn() }));
const updateMutate = vi.fn();
const pdfSave = vi.fn();
const toastError = toastMocks.error;

vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    clinic: { prescriptions: {
      get: { useQuery: () => ({ isLoading: false, data: record }) },
      updateMeta: { useMutation: () => ({ mutate: updateMutate, isPending: false }) },
    } },
    useUtils: () => ({ clinic: { prescriptions: { get: { invalidate: vi.fn() }, forPatient: { invalidate: vi.fn() } } } }),
  },
}));
vi.mock("wouter", () => ({ useLocation: () => ["/prescriptions/12", vi.fn()], useRoute: () => [true, { id: "12" }] }));
vi.mock("jspdf", () => ({
  jsPDF: class {
    setFillColor = vi.fn(); rect = pdfOperations.rect; setTextColor = vi.fn(); setFont = vi.fn(); setFontSize = vi.fn(); text = pdfOperations.text;
    splitTextToSize = (text: string) => [text]; save = pdfSave; addPage = vi.fn(); addImage = vi.fn();
    internal = { pageSize: { getWidth: () => 595, getHeight: () => 842 } };
  },
}));
vi.mock("html2canvas", () => ({
  default: vi.fn(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 720;
    canvas.height = 900;
    return canvas;
  }),
}));
vi.mock("sonner", () => ({ toast: toastMocks }));

const record = {
  patient: { id: 9, name: "Taylor Morgan", age: 34, gender: "Female", phone: "5552002" },
  prescription: {
    id: 12, patientId: 9, imageKey: "image-key", imageUrl: "/original.jpg", originalFilename: "original.jpg", originalMimeType: "image/jpeg",
    rawOcr: "RAW OCR TEXT\nLINE TWO", correctedText: "সকালে ও রাতে ওষুধটি গ্রহণ করুন", aiSummary: "ডাক্তার-পর্যালোচিত নির্দেশনা",
    medicines: [{ name: "Possibly Amoxicillin", dosage: "500 mg", frequency: "twice daily" }], importantFindings: [], tags: ["Follow-up"],
    doctorNotes: "Initial note", important: false, ocrConfidence: 72, sourceLanguageCode: "bn", sourceLanguageName: "Bengali", sourceScript: "Bengali", createdAt: new Date("2026-08-21T00:00:00Z"), updatedAt: new Date("2026-08-21T00:00:00Z"), ownerId: 1,
  },
};

import PrescriptionDetail from "./PrescriptionDetail";

beforeEach(() => {
  record.prescription.imageUrl = "/original.jpg";
  updateMutate.mockReset();
  pdfSave.mockReset();
  pdfOperations.text.mockReset();
  pdfOperations.rect.mockReset();
  toastError.mockReset();
  vi.mocked(html2canvas).mockResolvedValue((() => {
    const canvas = document.createElement("canvas");
    canvas.width = 720;
    canvas.height = 900;
    return canvas;
  })());
  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { configurable: true, value: () => ({ drawImage: vi.fn() }) });
  Object.defineProperty(HTMLCanvasElement.prototype, "toDataURL", { configurable: true, value: () => "data:image/png;base64,export" });
});
afterEach(() => cleanup());

describe("PrescriptionDetail", () => {
  it("keeps source-image access for legacy records but presents new records as text-only", () => {
    const { unmount } = render(<PrescriptionDetail />);
    expect(screen.getByAltText("Legacy prescription source")).toHaveAttribute("src", "/original.jpg");
    expect(screen.getByText("Legacy record")).toBeInTheDocument();
    unmount();

    record.prescription.imageUrl = null as unknown as string;
    render(<PrescriptionDetail />);
    expect(screen.getByText("Text-only record")).toBeInTheDocument();
    expect(screen.queryByAltText("Legacy prescription source")).not.toBeInTheDocument();
  });

  it("hides raw OCR while retaining the reviewed record and uncertainty indicators", async () => {
    render(<PrescriptionDetail />);
    expect(await screen.findByText(/Reviewed content/i)).toBeInTheDocument();
    expect(screen.queryByText(/Raw OCR output/i)).not.toBeInTheDocument();
    expect(screen.getByText("Possibly Amoxicillin")).toBeInTheDocument();
    expect(screen.getByText("verify")).toBeInTheDocument();
    expect(screen.getByText(/Source language: Bengali/i)).toBeInTheDocument();
  });

  it("updates notes and importance only from explicit actions and exports a PDF on request", async () => {
    const user = userEvent.setup();
    render(<PrescriptionDetail />);
    await screen.findByText(/Reviewed content/i);

    await user.click(screen.getByRole("button", { name: /Mark important/i }));
    await user.clear(screen.getByPlaceholderText(/Add a clinical follow-up note/i));
    await user.type(screen.getByPlaceholderText(/Add a clinical follow-up note/i), "Review after seven days");
    await user.click(screen.getByRole("button", { name: /Save note/i }));
    await user.click(screen.getByRole("button", { name: /Export PDF/i }));

    await waitFor(() => expect(updateMutate).toHaveBeenNthCalledWith(1, { id: 12, important: true }));
    expect(updateMutate).toHaveBeenNthCalledWith(2, { id: 12, doctorNotes: "Review after seven days" });
    await waitFor(() => expect(pdfSave).toHaveBeenCalledWith(expect.stringMatching(/^ClinicOCR-Taylor-Morgan-/)));
  });

  it("passes Bengali text and source-language metadata into the successful Unicode PDF renderer", async () => {
    const user = userEvent.setup();
    vi.mocked(html2canvas).mockImplementationOnce(async report => {
      expect(report.lang).toBe("bn");
      expect(report.textContent).toContain("Bengali · Bengali script");
      expect(report.textContent).toContain("সকালে ও রাতে ওষুধটি গ্রহণ করুন");
      const canvas = document.createElement("canvas");
      canvas.width = 720;
      canvas.height = 900;
      return canvas;
    });
    render(<PrescriptionDetail />);
    await user.click(await screen.findByRole("button", { name: /Export PDF/i }));
    await waitFor(() => expect(pdfSave).toHaveBeenCalled());
  });

  it("keeps the record page usable and reports an export failure when Unicode rendering cannot complete", async () => {
    const user = userEvent.setup();
    vi.mocked(html2canvas).mockRejectedValueOnce(new Error("Canvas rendering failed")).mockRejectedValueOnce(new Error("Canvas rendering failed"));
    render(<PrescriptionDetail />);
    await user.click(await screen.findByRole("button", { name: /Export PDF/i }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Could not generate the prescription PDF. Please try again."));
    expect(pdfSave).not.toHaveBeenCalled();
  });

  it("falls back to a direct text PDF when the canvas renderer is unavailable for a Latin-script record", async () => {
    const user = userEvent.setup();
    const originalText = record.prescription.correctedText;
    const originalSummary = record.prescription.aiSummary;
    const originalScript = record.prescription.sourceScript;
    record.prescription.correctedText = "Take the listed medicines after meals.";
    record.prescription.aiSummary = "Doctor-reviewed treatment instructions.";
    record.prescription.sourceScript = "Latin";
    vi.mocked(html2canvas).mockRejectedValueOnce(new Error("Foreign object rendering failed")).mockRejectedValueOnce(new Error("Canvas rendering failed"));
    render(<PrescriptionDetail />);
    await user.click(await screen.findByRole("button", { name: /Export PDF/i }));
    await waitFor(() => expect(pdfSave).toHaveBeenCalledWith(expect.stringMatching(/^ClinicOCR-Taylor-Morgan-/)));
    expect(pdfOperations.text).toHaveBeenCalledWith("ClinicOCR", expect.any(Number), expect.any(Number));
    expect(pdfOperations.text).toHaveBeenCalledWith("CORRECTED TEXT", expect.any(Number), expect.any(Number));
    expect(pdfOperations.text).toHaveBeenCalledWith("SUMMARY", expect.any(Number), expect.any(Number));
    expect(pdfOperations.text).toHaveBeenCalledWith("MEDICINES", expect.any(Number), expect.any(Number));
    expect(pdfOperations.rect).toHaveBeenCalled();
    record.prescription.correctedText = originalText;
    record.prescription.aiSummary = originalSummary;
    record.prescription.sourceScript = originalScript;
  });
});
