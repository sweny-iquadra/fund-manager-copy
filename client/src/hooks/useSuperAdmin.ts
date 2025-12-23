import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export function useSuperAdmin() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/auth/user");
      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }
      return response.json() as Promise<User>;
    },
  });

  return {
    isSuperAdmin: user?.isSuperAdmin || false,
    isLoading,
    user,
  };
}