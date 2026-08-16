import { Client } from "pg";
import { describe, expect, it } from "vitest";

describe("external ClinicOCR credentials", () => {
  it("connects to the configured Neon PostgreSQL database", async () => {
    const connectionString = process.env.NEON_DATABASE_URL;
    expect(connectionString).toBeTruthy();

    const client = new Client({ connectionString });
    try {
      await client.connect();
      const result = await client.query<{ reachable: number }>("select 1 as reachable");
      expect(result.rows[0]?.reachable).toBe(1);
    } finally {
      await client.end().catch(() => undefined);
    }
  }, 20_000);

  it("authenticates the configured Gemini API key against the model catalog", async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    expect(apiKey).toBeTruthy();

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey!)}`);
    expect(response.ok).toBe(true);
    const payload = (await response.json()) as { models?: Array<{ name: string }> };
    expect(payload.models?.length).toBeGreaterThan(0);
  }, 20_000);
});
