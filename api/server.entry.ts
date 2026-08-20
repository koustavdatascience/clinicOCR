import { createClinicApp } from "../server/_core/app";

// This file is bundled by scripts/build-vercel-server.mjs for the Vercel runtime.
// Keep the deploy-time entrypoint separate so api/index.ts can remain a small,
// traceable Vercel function wrapper.
export default createClinicApp();
