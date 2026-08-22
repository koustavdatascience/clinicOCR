// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const route = vi.hoisted(() => ({ setLocation: vi.fn() }));
const auth = vi.hoisted(() => ({ user: null as { id: number } | null, loading: false }));
const startLogin = vi.hoisted(() => vi.fn());

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => auth }));
vi.mock("@/const", () => ({ startLogin }));
vi.mock("wouter", () => ({ useLocation: () => ["/", route.setLocation] }));

import Landing from "./Landing";

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  });
  auth.user = null;
  auth.loading = false;
  route.setLocation.mockReset();
  startLogin.mockReset();
  window.history.replaceState({}, "", "/");
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ClinicOCR landing page", () => {
  it("starts sign-in only from an explicit public call to action", async () => {
    const user = userEvent.setup();
    render(<Landing />);
    await user.click(screen.getByRole("button", { name: /enter clinicocr/i }));
    expect(startLogin).toHaveBeenCalledTimes(1);
    expect(route.setLocation).not.toHaveBeenCalled();
  });

  it("hands an authenticated clinician into the dashboard workspace", async () => {
    auth.user = { id: 1 };
    render(<Landing />);
    await waitFor(() => expect(route.setLocation).toHaveBeenCalledWith("/workspace"));
  });
});
