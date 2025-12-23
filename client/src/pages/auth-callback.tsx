import { useEffect } from "react";
import { useLocation } from "wouter";
import { tokenManager, queryClient } from "@/lib/queryClient";

export default function AuthCallback() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get("accessToken");
      const refreshToken = urlParams.get("refreshToken");

      if (accessToken && refreshToken) {
        // Store tokens in localStorage (this will notify useAuth hook)
        tokenManager.setTokens(accessToken, refreshToken);

        // Invalidate auth queries
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

        // Force a hard redirect to ensure authentication state loads properly
        window.location.href = "/home";
      } else {
        // If no tokens, redirect to login with error
        const errorMessage =
          urlParams.get("message") || "Authentication failed";
        console.error("OAuth callback error:", errorMessage);
        setLocation("/login?error=" + encodeURIComponent(errorMessage));
      }
    };

    handleOAuthCallback();
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}
