import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { clerkClient, getAuth } from "@clerk/express";
import type { User } from "../../drizzle/schema";
import { claimLegacyUserByEmail, getUserByOpenId, upsertUser } from "../db";
import { ENV } from "./env";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  const startedAt = performance.now();

  try {
    if (ENV.clerkSecretKey) {
      const { userId } = getAuth(opts.req);
      if (userId) {
        user = await getUserByOpenId(userId) as User | undefined ?? null;
        if (!user) {
          const clerkUser = await clerkClient.users.getUser(userId);
          const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;
          const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || clerkUser.username || null;
          const identity = { openId: userId, name, email, loginMethod: "clerk", role: "user" as const };
          user = await claimLegacyUserByEmail(identity) as User | undefined ?? null;
          if (!user) {
            await upsertUser(identity);
            user = await getUserByOpenId(userId) as User | undefined ?? null;
          }
        }
      }
    }
  } catch {
    user = null;
  }

  opts.res.setHeader("Server-Timing", `auth;dur=${(performance.now() - startedAt).toFixed(1)}`);

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
