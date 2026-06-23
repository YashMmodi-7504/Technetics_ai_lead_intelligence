import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { setAccessToken, clearAccessToken, apiFetch, ApiError } from "../api/client";

export interface AuthUser {
  id: number;
  email: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface UseAuth extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<boolean>;
  bootstrapDevSession: () => Promise<void>;
}

const AuthContext = createContext<UseAuth | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setState((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const data = await apiFetch<{ accessToken: string; user: AuthUser }>(
          "/auth/login",
          { method: "POST", body: JSON.stringify({ email, password }) },
        );
        setAccessToken(data.accessToken);
        setState({
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return true;
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Login failed";
        setState((s) => ({ ...s, isLoading: false, error: message }));
        return false;
      }
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      clearAccessToken();
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setState((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const data = await apiFetch<{ accessToken: string; user: AuthUser }>(
          "/auth/register",
          { method: "POST", body: JSON.stringify({ email, password }) },
        );
        setAccessToken(data.accessToken);
        setState({
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return true;
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "Registration failed";
        setState((s) => ({ ...s, isLoading: false, error: message }));
        return false;
      }
    },
    [],
  );

  const bootstrapDevSession = useCallback(async (): Promise<void> => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const data = await apiFetch<{ accessToken: string; user: AuthUser }>(
        "/auth/dev-token",
        { method: "POST" },
      );
      setAccessToken(data.accessToken);
      setState({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      console.error("Dev session bootstrap failed:", err);
      setState((s) => ({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: "Dev session bootstrap failed",
      }));
    }
  }, []);

  useEffect(() => {
    const initSession = async () => {
      try {
        const data = await apiFetch<{ accessToken: string; user: AuthUser }>(
          "/auth/refresh",
          { method: "POST" }
        );
        setAccessToken(data.accessToken);
        setState({
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (refreshErr) {
        // In local development, if silent refresh fails, bootstrap dev session
        const isDev = process.env.NODE_ENV !== "production";
        if (isDev) {
          console.log("[useAuth] Silent refresh failed, bootstrapping dev session...");
          await bootstrapDevSession();
        } else {
          setState((s) => ({ ...s, isLoading: false, isAuthenticated: false }));
        }
      }
    };
    initSession();
  }, [bootstrapDevSession]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        register,
        bootstrapDevSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): UseAuth {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
