import { QueryClient, QueryFunction } from "@tanstack/react-query";

class APIError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
    this.name = "APIError";
  }
}

// Token management with event system
class TokenManager {
  private listeners: Set<() => void> = new Set();

  getAccessToken = () => localStorage.getItem("accessToken");
  getRefreshToken = () => localStorage.getItem("refreshToken");

  setTokens = (accessToken: string, refreshToken: string) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    this.notifyListeners();
  };

  clearTokens = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    this.notifyListeners();
  };

  addListener = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private notifyListeners = () => {
    this.listeners.forEach((listener) => listener());
  };
}

export const tokenManager = new TokenManager();

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenManager.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) throw new Error("Refresh failed");

    const data = await response.json();
    tokenManager.setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch (error) {
    tokenManager.clearTokens();
    return null;
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    let errorCode;

    try {
      const errorData = await res.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
      errorCode = errorData.code;
    } catch {
      // If JSON parsing fails, use the default error message
      const text = await res.text();
      if (text) errorMessage = text;
    }

    throw new APIError(res.status, `${res.status}: ${errorMessage}`, errorCode);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined
): Promise<Response> {
  const makeRequest = async (token?: string) => {
    const headers: HeadersInit = data
      ? { "Content-Type": "application/json" }
      : {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    await throwIfResNotOk(res);
    return res;
  };

  try {
    const accessToken = tokenManager.getAccessToken();
    return await makeRequest(accessToken || undefined);
  } catch (error) {
    if (error instanceof APIError && error.code === "TOKEN_EXPIRED") {
      // Try to refresh the token and retry
      const newAccessToken = await refreshAccessToken();
      if (newAccessToken) {
        return await makeRequest(newAccessToken);
      } else {
        // Refresh failed, redirect to login
        tokenManager.clearTokens();
        window.location.href = "/login";
        throw error;
      }
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const makeRequest = async (token?: string) => {
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(queryKey.join("/") as string, {
        headers,
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    };

    try {
      const accessToken = tokenManager.getAccessToken();
      return await makeRequest(accessToken || undefined);
    } catch (error) {
      if (error instanceof APIError && error.code === "TOKEN_EXPIRED") {
        // Try to refresh the token and retry
        const newAccessToken = await refreshAccessToken();
        if (newAccessToken) {
          return await makeRequest(newAccessToken);
        } else {
          // Refresh failed
          tokenManager.clearTokens();
          if (unauthorizedBehavior === "returnNull") {
            return null;
          }
          window.location.href = "/login";
          throw error;
        }
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
