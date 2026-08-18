// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { saveDraft, type PrescriptionDraft } from "@/lib/clinic";

const saveMutate = vi.fn();

vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/lib/trpc", () => ({
  trpc: { clinic: { prescriptions: { save: { useMutation: () => ({ mutate: saveMutate, isPending: false }) } } } },
}));
vi.mock("wouter", () => ({ useLocation: () => ["/review", vi.fn()] }));

import ReviewPrescription from "./ReviewPrescription";

const draft: PrescriptionDraft = {
  patientId: 9,
  reviewImageUrl: "blob:temporary-prescription-preview",
  rawOcr: "RAW OCR TEXT\nLINE TWO",
  correctedText: "Date: 20-09-2022 | Name: Ashvika | Age, Gender: 4 yr / F | Advice: SYP CALPOL 4 mL Q6H",
  summary: "Doctor review required",
  medicines: [{ name: "Possibly Amoxicillin", dosage: "500 mg", frequency: "twice daily" }],
  importantFindings: ["Verify handwriting"],
  tags: ["Prescription"],
  ocrConfidence: 71,
  aiStatus: "complete",
};

beforeEach(() => {
  sessionStorage.clear();
  saveMutate.mockReset();
});

afterEach(() => cleanup());

describe("ReviewPrescription", () => {
  it("formats the editable draft into clinical lines, hides raw OCR, and does not auto-save", async () => {
    saveDraft(draft);
    render(<ReviewPrescription />);

    const correctedText = await screen.findByPlaceholderText(/Review and enter corrected prescription text/i);
    expect(correctedText).toHaveValue("Date: 20-09-2022\nName: Ashvika\nAge, Gender: 4 yr / F\nAdvice:\nSYP CALPOL 4 mL Q6H");
    expect(screen.queryByText(/Raw OCR output/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/AI draft available/i)).not.toBeInTheDocument();
    expect(screen.getByText(/nothing is saved until you approve this record/i)).toBeInTheDocument();
    expect(saveMutate).not.toHaveBeenCalled();
  });

  it("sends a reviewed record only after the doctor clicks the explicit save action", async () => {
    saveDraft(draft);
    const user = userEvent.setup();
    render(<ReviewPrescription />);

    await screen.findByRole("heading", { name: /Review prescription/i });
    await user.type(screen.getByPlaceholderText(/follow up after 5 days/i), "Recheck in one week");
    fireEvent.click(screen.getByLabelText(/Mark as important record/i));
    await user.click(screen.getByRole("button", { name: /Save reviewed record/i }));

    await waitFor(() => expect(saveMutate).toHaveBeenCalledWith(expect.objectContaining({
      patientId: 9,
      rawOcr: "RAW OCR TEXT\nLINE TWO",
      doctorNotes: "Recheck in one week",
      important: true,
    })));
    expect(saveMutate.mock.calls[0]?.[0]).not.toHaveProperty("imageKey");
    expect(saveMutate.mock.calls[0]?.[0]).not.toHaveProperty("imageUrl");
    expect(saveMutate.mock.calls[0]?.[0]).not.toHaveProperty("originalFilename");
  });
});
