// The Vercel build first generates this fully bundled application module from
// api/server.entry.ts. Keeping this wrapper small ensures the function trace
// includes the generated runtime module instead of unresolved TypeScript imports.
export { default } from "./serverless.mjs";
