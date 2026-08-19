// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const workflow = vi.hoisted(() => ({
  setLocation: vi.fn(),
  analyzeMutate: vi.fn(),
  saveMutate: vi.fn(),
  updateMutate: vi.fn(),
  pdfSave: vi.fn(),
  record: null as any,
  patient: { id: 9, name: "Taylor Morgan", age: 34, gender: "Female", phone: "5552002", createdAt: new Date("2026-08-01"), updatedAt: new Date("2026-08-21") },
}));

vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("wouter", () => ({
  useLocation: () => ["/workflow", workflow.setLocation],
  useRoute: () => [true, { id: "12" }],
}));
vi.mock("jspdf", () => ({
  jsPDF: class {
    setFillColor = vi.fn(); rect = vi.fn(); setTextColor = vi.fn(); setFont = vi.fn(); setFontSize = vi.fn(); text = vi.fn();
    splitTextToSize = (text: string) => [text]; save = workflow.pdfSave;
  },
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ clinic: { patients: { invalidate: vi.fn() }, dashboard: { invalidate: vi.fn() }, prescriptions: { get: { invalidate: vi.fn() }, forPatient: { invalidate: vi.fn() } } } }),
    clinic: {
      patients: {
        list: { useQuery: () => ({ isLoading: false, data: [workflow.patient] }) },
        get: { useQuery: () => ({ isLoading: false, data: workflow.patient }) },
        duplicates: { useQuery: () => ({ data: [] }) },
        update: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
        delete: { useMutation: () => ({ mutate: vi.fn() }) },
      },
      prescriptions: {
        analyze: { useMutation: () => ({
          isPending: false,
          mutate: (input: any) => {
            workflow.analyzeMutate(input);
            sessionStorage.setItem("clinicocr-review-draft", JSON.stringify({
              patientId: input.patientId, originalFilename: input.filename, originalMimeType: "image/jpeg", imageKey: "workflow/original.jpg", imageUrl: "/workflow/original.jpg",
              rawOcr: "WORKFLOW RAW OCR\nUNCHANGED", correctedText: "Workflow corrected text", summary: "Workflow review summary",
              medicines: [{ name: "Possibly Workflow Medicine", dosage: "500 mg", frequency: "daily" }], importantFindings: [], tags: ["Workflow"], ocrConfidence: 74, aiStatus: "complete",
            }));
          },
        }) },
        save: { useMutation: (options: any) => ({
          isPending: false,
          mutate: (input: any) => {
            workflow.saveMutate(input);
            workflow.record = {
              patient: workflow.patient,
              prescription: { id: 12, ownerId: 1, patientId: input.patientId, imageKey: input.imageKey, imageUrl: input.imageUrl, originalFilename: input.originalFilename, originalMimeType: input.originalMimeType, rawOcr: input.rawOcr, correctedText: input.correctedText, aiSummary: input.aiSummary, medicines: input.medicines, importantFindings: input.importantFindings, tags: input.tags, doctorNotes: input.doctorNotes, important: input.important, ocrConfidence: input.ocrConfidence, createdAt: new Date("2026-08-21"), updatedAt: new Date("2026-08-21") },
            };
            options?.onSuccess(workflow.record);
          },
        }) },
        forPatient: { useQuery: () => ({ isLoading: false, data: workflow.record ? [{ id: 12, imageUrl: workflow.record.prescription.imageUrl, aiSummary: workflow.record.prescription.aiSummary, tags: workflow.record.prescription.tags, important: workflow.record.prescription.important, createdAt: workflow.record.prescription.createdAt }] : [] }) },
        get: { useQuery: () => ({ isLoading: false, data: workflow.record }) },
        updateMeta: { useMutation: () => ({
          isPending: false,
          mutate: (input: any) => { workflow.updateMutate(input); if (workflow.record && input.important !== undefined) workflow.record.prescription.important = input.important; if (workflow.record && input.doctorNotes !== undefined) workflow.record.prescription.doctorNotes = input.doctorNotes; },
        }) },
      },
    },
  },
}));

import UploadPrescription from "./UploadPrescription";
import ReviewPrescription from "./ReviewPrescription";
import PatientDetail from "./PatientDetail";
import PrescriptionDetail from "./PrescriptionDetail";

beforeEach(() => {
  sessionStorage.clear();
  workflow.record = null;
  workflow.setLocation.mockReset(); workflow.analyzeMutate.mockReset(); workflow.saveMutate.mockReset(); workflow.updateMutate.mockReset(); workflow.pdfSave.mockReset();
  Object.defineProperty(URL, "createObjectURL", { value: vi.fn(() => "blob:workflow"), configurable: true });
});
afterEach(() => cleanup());

describe("ClinicOCR unified review-first workflow", () => {
  it("hands an uploaded image to review, persists only on approval, then supports history, metadata, and report export", async () => {
    const user = userEvent.setup();
    render(<UploadPrescription />);
    await user.click(screen.getByRole("button", { name: /Taylor Morgan/i }));
    await user.upload(screen.getByLabelText(/Choose prescription image/i), new File(["image-data"], "workflow.jpg", { type: "image/jpeg" }));
    await user.click(screen.getByRole("button", { name: /Analyze for review/i }));
    await waitFor(() => expect(workflow.analyzeMutate).toHaveBeenCalledWith(expect.objectContaining({ patientId: 9, filename: "workflow.jpg" })));
    expect(workflow.saveMutate).not.toHaveBeenCalled();

    cleanup();
    render(<ReviewPrescription />);
    const reviewedText = await screen.findByPlaceholderText(/Review and enter corrected prescription text/i);
    expect((reviewedText as HTMLTextAreaElement).value).toContain("Workflow corrected text");
    await user.click(screen.getByRole("button", { name: /Save reviewed record/i }));
    await waitFor(() => expect(workflow.saveMutate).toHaveBeenCalledWith(expect.objectContaining({ rawOcr: "WORKFLOW RAW OCR\nUNCHANGED", patientId: 9 })));

    cleanup();
    render(<PatientDetail />);
    await user.click(await screen.findByRole("button", { name: /Prescription record/i }));
    expect(workflow.setLocation).toHaveBeenCalledWith("/prescriptions/12");

    cleanup();
    render(<PrescriptionDetail />);
    await user.click(await screen.findByRole("button", { name: /Mark important/i }));
    await user.type(screen.getByPlaceholderText(/Add a clinical follow-up note/i), "Workflow follow-up");
    await user.click(screen.getByRole("button", { name: /Save note/i }));
    await user.click(screen.getByRole("button", { name: /Export PDF/i }));
    expect(workflow.updateMutate).toHaveBeenCalledWith({ id: 12, important: true });
    expect(workflow.updateMutate).toHaveBeenCalledWith({ id: 12, doctorNotes: "Workflow follow-up" });
    expect(workflow.pdfSave).toHaveBeenCalled();
  });
});
