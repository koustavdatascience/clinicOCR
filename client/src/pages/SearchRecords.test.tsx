// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { setLocation, searchUseQuery } = vi.hoisted(() => ({
  setLocation: vi.fn(),
  searchUseQuery: vi.fn(() => ({
    isLoading: false,
    data: [{ id: 12, patientId: 9, patientName: "Taylor Morgan", imageUrl: "/original.jpg", tags: ["Follow-up"], important: true, medicines: [{ name: "Possibly Amoxicillin" }], createdAt: new Date("2026-08-21") }],
  })),
}));

vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/lib/trpc", () => ({ trpc: { clinic: { prescriptions: { search: { useQuery: searchUseQuery } } } } }));
vi.mock("wouter", () => ({ useLocation: () => ["/search", setLocation] }));

import SearchRecords from "./SearchRecords";

beforeEach(() => { setLocation.mockReset(); searchUseQuery.mockClear(); });
afterEach(() => cleanup());

describe("SearchRecords", () => {
  it("passes deterministic filters, shows saved records, clears inputs, and opens a record", async () => {
    const user = userEvent.setup();
    render(<SearchRecords />);

    await user.type(screen.getByPlaceholderText(/Patient name or phone/i), "Taylor");
    await user.type(screen.getByPlaceholderText(/Medicine name/i), "Amoxicillin");
    fireEvent.change(screen.getByLabelText(/From date/i), { target: { value: "2026-08-01" } });
    fireEvent.change(screen.getByLabelText(/To date/i), { target: { value: "2026-08-31" } });

    await waitFor(() => expect(searchUseQuery).toHaveBeenLastCalledWith(expect.objectContaining({ patient: "Taylor", medicine: "Amoxicillin", from: expect.any(Date), to: expect.any(Date) })));
    expect(screen.getByText("Possibly Amoxicillin")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Taylor Morgan/i }));
    expect(setLocation).toHaveBeenCalledWith("/prescriptions/12");

    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByPlaceholderText(/Patient name or phone/i)).toHaveValue("");
    expect(screen.getByPlaceholderText(/Medicine name/i)).toHaveValue("");
  });
});
