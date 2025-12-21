import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { authService } from "@/src/services/auth.service";
import { useAuthStore } from "@/src/stores/auth.store";
import type { LoginCredentials, RegisterCredentials } from "@/src/types";
import { createClient } from "@/src/lib/supabase/client";

// Login mutation
export const useLogin = () => {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      authService.login(credentials),
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.setQueryData(["auth", "user"], data.user);
    },
  });
};

// Register mutation
export const useRegister = () => {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: (credentials: RegisterCredentials) =>
      authService.register(credentials),
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.setQueryData(["auth", "user"], data.user);
    },
  });
};

// Logout mutation
export const useLogout = () => {
  const queryClient = useQueryClient();
  const { logout: logoutStore } = useAuthStore();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      logoutStore();
      queryClient.clear();
    },
  });
};

// Get current user query
export const useCurrentUser = () => {
  const { user, setUser } = useAuthStore();

  const query = useQuery({
    queryKey: ["auth", "user"],
    queryFn: () => authService.getCurrentUser(),
    enabled: true, // Always enabled to check session
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update store when data is fetched
  useEffect(() => {
    if (query.data) {
      setUser(query.data);
    } else if (query.error && user) {
      // If query fails and we have user in store, clear it
      setUser(null);
    }
  }, [query.data, query.error, user, setUser]);

  return {
    ...query,
    data: query.data || user, // Return store user if query hasn't loaded yet
  };
};
