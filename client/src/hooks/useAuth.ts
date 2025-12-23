import { useQuery } from "@tanstack/react-query";
import { tokenManager, getQueryFn, queryClient } from "@/lib/queryClient";
import { useEffect, useState } from "react";

export function useAuth() {
  const [hasToken, setHasToken] = useState(!!tokenManager.getAccessToken());
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Update hasToken state when tokens change (for OAuth callbacks)
  useEffect(() => {
    const updateTokenState = () => {
      const newHasToken = !!tokenManager.getAccessToken();

      // If we're getting a token for the first time, set transitioning state
      if (!hasToken && newHasToken) {
        setIsTransitioning(true);
        // Immediately invalidate and refetch user data when we get tokens
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      }

      setHasToken(newHasToken);
    };

    // Listen for token changes
    const removeListener = tokenManager.addListener(updateTokenState);

    // Listen for storage changes (in case tokens are set in another tab/window)
    window.addEventListener("storage", updateTokenState);

    return () => {
      removeListener();
      window.removeEventListener("storage", updateTokenState);
    };
  }, [hasToken]);

  const {
    data: user,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    enabled: hasToken, // Only query if we have a token
    staleTime: 0, // Always consider the data stale
  });

  // Force refetch when tokens are set for the first time
  useEffect(() => {
    if (hasToken && !user && !isLoading) {
      refetch();
    }
  }, [hasToken, user, isLoading, refetch]);

  // Clear transitioning state once we have user data or an error
  useEffect(() => {
    if (isTransitioning && (!isLoading || user || !hasToken)) {
      setIsTransitioning(false);
    }
  }, [isTransitioning, isLoading, user, hasToken]);

  return {
    user,
    isLoading: (hasToken && isLoading) || isTransitioning,
    isAuthenticated: !!user && hasToken,
  };
}
