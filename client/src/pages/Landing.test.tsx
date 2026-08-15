// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const route = vi.hoisted(() => ({ setLocation: vi.fn() }));
const auth = vi.hoisted(() => ({ user: null as { id: number } | null, loading: false }));
const startLogin = vi.hoisted(() => vi.fn());
const scrollIntoView = vi.hoisted(() => vi.fn());

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => auth }));
vi.mock("@/const", () => ({ startLogin }));
vi.mock("wouter", () => ({ useLocation: () => ["/", route.setLocation] }));

import Landing, { getLandingMotionPlan } from "./Landing";

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
  scrollIntoView.mockReset();
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: scrollIntoView });
  window.history.replaceState({}, "", "/");
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ClinicOCR landing page", () => {
  it("uses looping motion plans in normal mode and removes those loops for reduced-motion visitors", () => {
    const active = getLandingMotionPlan(false);
    const reduced = getLandingMotionPlan(true);
    expect(active.mode).toBe("active");
    expect(active.heroScan.transition.repeat).toBe(Infinity);
    expect(active.aboutEvidence.transition.repeat).toBe(Infinity);
    expect(active.signInRings.transition.repeat).toBe(Infinity);
    expect(reduced.mode).toBe("reduced");
    expect(reduced.heroScan.animate).toEqual({});
    expect(reduced.aboutEvidence.animate).toEqual({});
    expect(reduced.signInRings.animate).toEqual({});
  });

  it("guides visitors from the Hero to the separate Sign-in section, then starts sign-in only from its explicit action", async () => {
    const user = userEvent.setup();
    render(<Landing />);
    expect(screen.getByText(/About ClinicOCR/i)).toBeInTheDocument();
    expect(screen.getByText(/Secure sign in/i)).toBeInTheDocument();
    expect(screen.getByTestId("hero-scan-line")).toBeInTheDocument();
    expect(screen.getByTestId("about-evidence-flow")).toBeInTheDocument();
    expect(screen.getByTestId("signin-session-rings")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /enter clinicocr/i }));
    expect(scrollIntoView).toHaveBeenCalled();
    expect(startLogin).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /sign in to clinicocr/i }));
    expect(startLogin).toHaveBeenCalledTimes(1);
    expect(route.setLocation).not.toHaveBeenCalled();
  });

  it("hands an authenticated clinician into the dashboard workspace", async () => {
    auth.user = { id: 1 };
    render(<Landing />);
    await waitFor(() => expect(route.setLocation).toHaveBeenCalledWith("/workspace"));
  });
});
