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
  originalFilename: "prescription.jpg",
  originalMimeType: "image/jpeg",
  imageKey: "clinicocr/9/original.jpg",
  imageUrl: "/manus-storage/clinicocr/9/original.jpg",
  rawOcr: "RAW OCR TEXT\nLINE TWO",
  correctedText: "Corrected prescription text",
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
  it("shows the raw OCR unchanged and does not auto-save the draft", async () => {
    saveDraft(draft);
    render(<ReviewPrescription />);

    expect(await screen.findByText((_, element) => element?.tagName === "PRE" && element.textContent === "RAW OCR TEXT\nLINE TWO")).toBeInTheDocument();
    expect(screen.getByText(/nothing is persisted until you use the Save reviewed record action/i)).toBeInTheDocument();
    expect(saveMutate).not.toHaveBeenCalled();
  });

  it("sends a reviewed record only after the doctor clicks the explicit save action", async () => {
    saveDraft(draft);
    const user = userEvent.setup();
    render(<ReviewPrescription />);

    await screen.findByRole("heading", { name: /Review the prescription draft/i });
    await user.type(screen.getByPlaceholderText(/follow up after 5 days/i), "Recheck in one week");
    fireEvent.click(screen.getByLabelText(/Mark as important record/i));
    await user.click(screen.getByRole("button", { name: /Save reviewed record/i }));

    await waitFor(() => expect(saveMutate).toHaveBeenCalledWith(expect.objectContaining({
      patientId: 9,
      rawOcr: "RAW OCR TEXT\nLINE TWO",
      doctorNotes: "Recheck in one week",
      important: true,
    })));
  });
});
