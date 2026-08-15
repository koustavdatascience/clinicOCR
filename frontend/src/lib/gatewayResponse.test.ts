import { describe, expect, it, vi } from "vitest";
import { ANALYSIS_TIMEOUT_MESSAGE, fetchClinicRpc, formatAnalysisError } from "./gatewayResponse";

describe("ClinicOCR gateway response handling", () => {
  it("converts a non-JSON gateway timeout into a clinician-facing retry message", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("An error occurred", { status: 504, headers: { "content-type": "text/html" } }));
    await expect(fetchClinicRpc("/api/trpc/clinic.prescriptions.analyze", undefined, fetchImpl)).rejects.toThrow(ANALYSIS_TIMEOUT_MESSAGE);
  });

  it("retains a friendly message for malformed gateway payloads from an older deployment", () => {
    expect(formatAnalysisError('Unexpected token \'A\', "An error o"... is not valid JSON')).toBe(ANALYSIS_TIMEOUT_MESSAGE);
  });
});
