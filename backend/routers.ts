import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { clinicRouter } from "./clinicRouter";

export const appRouter = router({
  // If socket.io is needed, register it in backend/_core/index.ts. API routes should start with '/api/'.
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(() => {
      return {
        success: true,
      } as const;
    }),
  }),
  clinic: clinicRouter,
});

export type AppRouter = typeof appRouter;
