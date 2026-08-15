// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const analyzeMutate = vi.fn();

vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/lib/trpc", () => ({
  trpc: { clinic: {
    patients: {
      list: { useQuery: () => ({ isLoading: false, data: [{ id: 9, name: "Taylor Morgan", phone: "5552002" }] }) },
      get: { useQuery: () => ({ data: null }) },
    },
    prescriptions: { analyze: { useMutation: () => ({ mutate: analyzeMutate, isPending: false }) } },
  } },
}));
vi.mock("wouter", () => ({ useLocation: () => ["/upload", vi.fn()] }));

import UploadPrescription from "./UploadPrescription";
import { formatAnalysisError } from "@/lib/gatewayResponse";

beforeEach(() => {
  analyzeMutate.mockReset();
  Object.defineProperty(URL, "createObjectURL", { value: vi.fn(() => "blob:preview"), configurable: true });
});
afterEach(() => cleanup());

describe("UploadPrescription", () => {
  it("turns a gateway timeout parsing failure into an actionable recovery message", () => {
    expect(formatAnalysisError('Unexpected token \'A\', "An error o"... is not valid JSON')).toMatch(/Analysis took longer/i);
  });

  it("requires both a selected patient and a valid image before analysis can start", async () => {
    const user = userEvent.setup();
    render(<UploadPrescription />);

    const analyze = screen.getByRole("button", { name: /Analyze for review/i });
    expect(analyze).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /Taylor Morgan/i }));
    expect(analyze).toBeDisabled();

    const imageInput = screen.getByLabelText(/Choose prescription image/i);
    await user.upload(imageInput, new File(["image-data"], "prescription.jpg", { type: "image/jpeg" }));
    expect(analyze).toBeEnabled();

    await user.click(analyze);
    await waitFor(() => expect(analyzeMutate).toHaveBeenCalledWith(expect.objectContaining({ patientId: 9, filename: "prescription.jpg" })));
  });
});
