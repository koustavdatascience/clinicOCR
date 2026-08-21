import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = new URL("..", import.meta.url);
const readProjectFile = (name: string) => readFileSync(new URL(name, root), "utf8");

describe("Vercel deployment safety", () => {
  it("keeps deploy-time secrets out of the committed environment template", () => {
    const template = readProjectFile("docs/VERCEL_ENVIRONMENT_TEMPLATE.txt");
    expect(template).toContain("NEON_DATABASE_URL=");
    expect(template).toContain("GEMINI_API_KEY=");
    expect(template).toContain("CLERK_SECRET_KEY=");
    expect(template).toContain("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=");
    const credentialLines = template
      .split(/\r?\n/)
      .filter(line => /^(NEON_DATABASE_URL|GEMINI_API_KEY|CLERK_SECRET_KEY)=/.test(line));
    expect(credentialLines).toHaveLength(3);
    expect(credentialLines.every(line => line.endsWith("="))).toBe(true);
  });

  it("protects local credential files and routes API traffic through the Vercel function", () => {
    const ignoreRules = readProjectFile(".gitignore");
    const vercelConfig = JSON.parse(readProjectFile("vercel.json"));
    expect(ignoreRules).toContain(".env.*");
    expect(ignoreRules).toContain(".vercel/");
    expect(vercelConfig.rewrites).toContainEqual({ source: "/api/:path*", destination: "/api/index" });
    expect(vercelConfig.outputDirectory).toBe("dist/public");
    expect(vercelConfig.functions["api/index.ts"].includeFiles).toBe("api/serverless.mjs");
    expect(readProjectFile("package.json")).toContain("scripts/build-vercel-server.mjs");
    expect(readProjectFile("package.json")).toContain("scripts/smoke-vercel-function.mjs");
    expect(readProjectFile("server/_core/env.ts")).toContain("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
    expect(readProjectFile("server/_core/app.ts")).toContain("publishableKey: ENV.clerkPublishableKey");
  });

  it("passes the filename-only repository secret scan", () => {
    expect(() => execFileSync("node", ["scripts/verify-deployment-secrets.mjs"], { cwd: new URL("..", import.meta.url), stdio: "pipe" })).not.toThrow();
  });
});
