import { useAuth } from "./useAuth.js";

export function useAuthGuard() {
  const { user, isAuthenticated, isLoading, error } = useAuth();

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
  };
}
