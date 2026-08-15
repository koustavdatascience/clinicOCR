import express from "express";
import { clerkMiddleware } from "@clerk/express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { ENV } from "./env";

/**
 * Constructs the API application without binding a network port. This keeps the
 * existing development server compatible with Vercel's serverless function model.
 */
export function createClinicApp() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  if (ENV.clerkSecretKey) {
    app.use(clerkMiddleware({ publishableKey: ENV.clerkPublishableKey || undefined }));
  }
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );
  return app;
}
