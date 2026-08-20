import { build } from "esbuild";

await build({
  entryPoints: ["api/server.entry.ts"],
  outfile: "api/serverless.mjs",
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  packages: "external",
  logLevel: "info",
});
