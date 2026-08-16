// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const route = vi.hoisted(() => ({ setLocation: vi.fn() }));
const login = vi.hoisted(() => vi.fn());
const auth = vi.hoisted(() => ({ user: null as { id: number } | null, loading: false, login }));
const scrollIntoView = vi.hoisted(() => vi.fn());

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => auth }));
vi.mock("wouter", () => ({ useLocation: () => ["/", route.setLocation] }));

import Landing, { getLandingMotionPlan, getLandingNavigationState } from "./Landing";

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  });
  auth.user = null;
  auth.loading = false;
  route.setLocation.mockReset();
  login.mockReset();
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
    expect(active.heroPulse.transition.repeat).toBe(Infinity);
    expect(active.heroSignal.transition.repeat).toBe(Infinity);
    expect(active.signInRings.transition.repeat).toBe(Infinity);
    expect(reduced.mode).toBe("reduced");
    expect(reduced.heroScan.animate).toEqual({});
    expect(reduced.heroPulse.animate).toEqual({});
    expect(reduced.heroSignal.animate).toEqual({});
    expect(reduced.signInRings.animate).toEqual({});
  });

  it("compacts the navigation into its glass state after scrolling beyond the Hero threshold", () => {
    render(<Landing />);
    const navigation = screen.getByTestId("landing-navigation");
    expect(getLandingNavigationState(28)).toBe("expanded");
    expect(navigation).toHaveAttribute("data-navigation-state", "expanded");
    Object.defineProperty(window, "scrollY", { configurable: true, value: 56 });
    fireEvent.scroll(window);
    expect(getLandingNavigationState(56)).toBe("compact");
    expect(navigation).toHaveAttribute("data-navigation-state", "compact");
  });

  it("opens Clerk from each visible sign-in call to action instead of only scrolling to the sign-in section", async () => {
    const user = userEvent.setup();
    render(<Landing />);
    expect(screen.getByText(/How ClinicOCR works/i)).toBeInTheDocument();
    expect(screen.getByText(/Secure sign in/i)).toBeInTheDocument();
    expect(screen.getByText("Language aware")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Workflow" })).toBeInTheDocument();
    expect(screen.getByTestId("hero-staged-copy")).toBeInTheDocument();
    expect(screen.getByTestId("hero-signal-trace")).toBeInTheDocument();
    const workflowCard = screen.getByTestId("about-evidence-flow");
    expect(screen.getByTestId("landing-root")).toHaveClass("overflow-x-hidden");
    expect(workflowCard).toHaveAttribute("data-evidence-position", "fixed");
    expect(workflowCard).toHaveClass("lg:sticky", "lg:top-[15vh]", "lg:h-[60vh]", "lg:w-1/2");
    expect(screen.getByTestId("workflow-scroll-region")).toHaveAttribute("data-workflow-layout", "sticky-two-column");
    expect(screen.getByTestId("workflow-scroll-region")).toHaveClass("lg:flex-row");
    expect(screen.getByTestId("workflow-stage-list")).toHaveClass("lg:w-1/2", "lg:pb-[75vh]");
    expect(screen.getByTestId("signin-session-rings")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /review the draft/i }));
    await waitFor(() => expect(screen.getByText("Structured text · medicines · notes")).toBeInTheDocument());
    expect(workflowCard).toHaveAttribute("data-active-step", "02");
    expect(screen.getByTestId("workflow-visual-02")).toHaveAttribute("data-visual-state", "active");
    expect(screen.getByTestId("workflow-visual-03")).toHaveAttribute("data-visual-state", "inactive");
    await user.click(screen.getByRole("button", { name: /enter clinicocr/i }));
    expect(login).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /sign in to clinicocr/i }));
    expect(login).toHaveBeenCalledTimes(2);
    expect(route.setLocation).not.toHaveBeenCalled();
  });

  it("advances the clinical workflow as its steps cross the reading line during scroll", async () => {
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 1000 });
    render(<Landing />);
    const upload = screen.getByRole("button", { name: /upload the prescription/i });
    const review = screen.getByRole("button", { name: /review the draft/i });
    const approve = screen.getByRole("button", { name: /approve the record/i });
    const setTop = (element: HTMLElement, top: number) => Object.defineProperty(element, "getBoundingClientRect", { configurable: true, value: () => ({ top }) });

    setTop(upload, 120);
    setTop(review, 720);
    setTop(approve, 1180);
    fireEvent.scroll(window);

    setTop(review, 280);
    fireEvent.scroll(window);
    await waitFor(() => expect(screen.getByText("Structured text · medicines · notes")).toBeInTheDocument());
    expect(screen.getByTestId("about-evidence-flow")).toHaveAttribute("data-active-step", "02");

    setTop(approve, 280);
    fireEvent.scroll(window);
    await waitFor(() => expect(screen.getByText("Ready to save")).toBeInTheDocument());
    expect(screen.getByTestId("about-evidence-flow")).toHaveAttribute("data-active-step", "03");
    expect(screen.getByTestId("workflow-visual-03")).toHaveAttribute("data-visual-state", "active");
  });

  it("hands an authenticated clinician into the dashboard workspace", async () => {
    auth.user = { id: 1 };
    render(<Landing />);
    await waitFor(() => expect(route.setLocation).toHaveBeenCalledWith("/workspace"));
  });
});
