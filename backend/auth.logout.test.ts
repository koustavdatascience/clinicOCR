import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "user_clerk_sample",
      email: "sample@example.com",
      name: "Sample User",
      loginMethod: "clerk",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("auth.logout", () => {
  it("returns success without handling a server-owned authentication cookie", async () => {
    const caller = appRouter.createCaller(createAuthContext());

    await expect(caller.auth.logout()).resolves.toEqual({ success: true });
  });
});
