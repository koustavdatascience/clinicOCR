// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const updateMutate = vi.fn();
const pdfSave = vi.fn();

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
    setFillColor = vi.fn(); rect = vi.fn(); setTextColor = vi.fn(); setFont = vi.fn(); setFontSize = vi.fn(); text = vi.fn();
    splitTextToSize = (text: string) => [text]; save = pdfSave;
  },
}));

const record = {
  patient: { id: 9, name: "Taylor Morgan", age: 34, gender: "Female", phone: "5552002" },
  prescription: {
    id: 12, patientId: 9, imageKey: "image-key", imageUrl: "/original.jpg", originalFilename: "original.jpg", originalMimeType: "image/jpeg",
    rawOcr: "RAW OCR TEXT\nLINE TWO", correctedText: "Reviewed prescription", aiSummary: "Doctor-approved summary",
    medicines: [{ name: "Possibly Amoxicillin", dosage: "500 mg", frequency: "twice daily" }], importantFindings: [], tags: ["Follow-up"],
    doctorNotes: "Initial note", important: false, ocrConfidence: 72, createdAt: new Date("2026-08-21T00:00:00Z"), updatedAt: new Date("2026-08-21T00:00:00Z"), ownerId: 1,
  },
};

import PrescriptionDetail from "./PrescriptionDetail";

beforeEach(() => updateMutate.mockReset());
afterEach(() => cleanup());

describe("PrescriptionDetail", () => {
  it("shows the preserved raw OCR and flags uncertain medicine names", async () => {
    render(<PrescriptionDetail />);
    expect(await screen.findByText((_, element) => element?.tagName === "PRE" && element.textContent === "RAW OCR TEXT\nLINE TWO")).toBeInTheDocument();
    expect(screen.getByText("Possibly Amoxicillin")).toBeInTheDocument();
    expect(screen.getByText("verify")).toBeInTheDocument();
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
    expect(pdfSave).toHaveBeenCalledWith(expect.stringMatching(/^ClinicOCR-Taylor-Morgan-/));
  });
});
