export const ENV = {
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  neonDatabaseUrl: process.env.NEON_DATABASE_URL ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  clerkSecretKey: process.env.CLERK_SECRET_KEY ?? "",
  clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? process.env.VITE_CLERK_PUBLISHABLE_KEY ?? "",
};
