import { ClerkProvider, useAuth as useClerkAuth } from "@clerk/react";
import { trpc } from "@/lib/trpc";
import { getClerkToken, setClerkTokenResolver } from "@/lib/clerkToken";
import { fetchClinicRpc } from "@/lib/gatewayResponse";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useEffect, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: 1 },
  },
});

function ClerkTokenBridge({ children }: { children: ReactNode }) {
  const { getToken, isLoaded } = useClerkAuth();
  const [bridgeReady, setBridgeReady] = useState(false);
  useEffect(() => {
    if (!isLoaded) {
      setBridgeReady(false);
      setClerkTokenResolver(async () => null);
      return;
    }
    setClerkTokenResolver(() => getToken());
    setBridgeReady(true);
    return () => {
      setBridgeReady(false);
      setClerkTokenResolver(async () => null);
    };
  }, [getToken, isLoaded]);
  if (!bridgeReady) {
    return <div className="flex min-h-screen items-center justify-center bg-[#062c36] p-6 text-center text-sm leading-6 text-teal-50/80">Establishing secure clinical session…</div>;
  }
  return <>{children}</>;
}

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      async headers() {
        const token = await getClerkToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
      fetch(input, init) {
        return fetchClinicRpc(input, { ...(init ?? {}), credentials: "include" });
      },
    }),
  ],
});

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const isDevelopmentLandingPreview = import.meta.env.DEV && new URLSearchParams(window.location.search).has("preview");

function Root() {
  const application = <trpc.Provider client={trpcClient} queryClient={queryClient}><QueryClientProvider client={queryClient}><App /></QueryClientProvider></trpc.Provider>;
  if (!publishableKey) {
    if (isDevelopmentLandingPreview) return application;
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-center text-sm leading-6 text-slate-300">ClinicOCR authentication is not configured for this environment.</div>;
  }
  return <ClerkProvider publishableKey={publishableKey}><ClerkTokenBridge>{application}</ClerkTokenBridge></ClerkProvider>;
}

createRoot(document.getElementById("root")!).render(<Root />);
