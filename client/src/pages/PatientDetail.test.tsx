// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const setLocation = vi.fn();

vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ clinic: { patients: { invalidate: vi.fn() }, dashboard: { invalidate: vi.fn() } } }),
    clinic: {
      patients: {
        get: { useQuery: () => ({ isLoading: false, data: { id: 9, name: "Taylor Morgan", age: 34, gender: "Female", phone: "5552002", createdAt: new Date("2026-08-01"), updatedAt: new Date("2026-08-21") } }) },
        duplicates: { useQuery: () => ({ data: [] }) },
        update: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
        delete: { useMutation: () => ({ mutate: vi.fn() }) },
      },
      prescriptions: { forPatient: { useQuery: () => ({ isLoading: false, data: [{ id: 12, imageUrl: "/original.jpg", aiSummary: "Reviewed prescription summary", tags: ["Follow-up"], important: true, createdAt: new Date("2026-08-21") }] }) } },
    },
  },
}));
vi.mock("wouter", () => ({ useLocation: () => ["/patients/9", setLocation], useRoute: () => [true, { id: "9" }] }));

import PatientDetail from "./PatientDetail";

afterEach(() => { cleanup(); setLocation.mockReset(); });

describe("PatientDetail", () => {
  it("shows the important prescription history and opens the selected saved record", async () => {
    const user = userEvent.setup();
    render(<PatientDetail />);

    expect(await screen.findByText(/Prescription history/i)).toBeInTheDocument();
    expect(screen.getByText(/Important records are kept at the top/i)).toBeInTheDocument();
    expect(screen.getByText("Follow-up")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Prescription record/i }));
    expect(setLocation).toHaveBeenCalledWith("/prescriptions/12");
  });
});
