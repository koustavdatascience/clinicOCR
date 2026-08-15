import { useAuth as useClerkAuth, useClerk, useUser } from "@clerk/react";
import { trpc } from "@/lib/trpc";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const isDevelopmentLandingPreview = import.meta.env.DEV && typeof window !== "undefined" && new URLSearchParams(window.location.search).has("preview");
  if (isDevelopmentLandingPreview) {
    return {
      user: null,
      loading: false,
      error: null,
      isAuthenticated: false,
      refresh: async () => undefined,
      login: () => undefined,
      logout: async () => undefined,
    };
  }
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const { isLoaded: isClerkLoaded, isSignedIn } = useUser();
  const { isLoaded: isAuthLoaded } = useClerkAuth();
  const clerk = useClerk();
  const utils = trpc.useUtils();
  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: Boolean(isClerkLoaded && isSignedIn),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const login = useCallback(() => {
    clerk.openSignIn();
  }, [clerk]);

  const logout = useCallback(async () => {
    await clerk.signOut();
    utils.auth.me.setData(undefined, null);
    await utils.auth.me.invalidate();
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      window.location.assign("/");
    }
  }, [clerk, utils]);

  const loading = !isClerkLoaded || !isAuthLoaded || Boolean(isSignedIn && meQuery.isLoading);
  const user = isSignedIn ? meQuery.data ?? null : null;

  useEffect(() => {
    if (!redirectOnUnauthenticated || loading || user || typeof window === "undefined") return;
    if (redirectPath) {
      window.location.assign(redirectPath);
      return;
    }
    clerk.openSignIn();
  }, [clerk, loading, redirectOnUnauthenticated, redirectPath, user]);

  return useMemo(() => ({
    user,
    loading,
    error: meQuery.error ?? null,
    isAuthenticated: Boolean(user),
    refresh: () => meQuery.refetch(),
    login,
    logout,
  }), [loading, login, logout, meQuery, user]);
}
