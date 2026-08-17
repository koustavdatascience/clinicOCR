export const ANALYSIS_TIMEOUT_MESSAGE = "Analysis took longer than the secure review window. Please try the image again; no prescription record was saved.";

export async function fetchClinicRpc(input: RequestInfo | URL, init?: RequestInit, fetchImpl: typeof fetch = globalThis.fetch): Promise<Response> {
  const response = await fetchImpl(input, init);
  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok && !contentType.includes("application/json")) {
    if (response.status === 504 || response.status === 408) throw new Error(ANALYSIS_TIMEOUT_MESSAGE);
    throw new Error(`ClinicOCR could not complete that request (${response.status}). Please try again.`);
  }
  return response;
}

export function formatAnalysisError(message: string): string {
  if (/unexpected token|gateway timeout|status of 504|err_http2_protocol_error/i.test(message)) return ANALYSIS_TIMEOUT_MESSAGE;
  return message;
}
