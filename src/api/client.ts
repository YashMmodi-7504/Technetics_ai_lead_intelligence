// In-memory access token store. Never persisted to localStorage.
// Refresh token lives in an httpOnly cookie managed by the server.
let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setAccessToken(token: string): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}

async function silentRefresh(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        accessToken = null;
        return null;
      }
      const data = (await res.json()) as { accessToken: string };
      accessToken = data.accessToken;
      return accessToken;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

async function ensureToken(): Promise<string | null> {
  if (accessToken) return accessToken;
  return silentRefresh();
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await ensureToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  // Don't set Content-Type for FormData — the browser sets it with the boundary automatically.
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 401) {
    const refreshed = await silentRefresh();
    if (refreshed) {
      headers.Authorization = `Bearer ${refreshed}`;
      const retry = await fetch(`/api${path}`, {
        ...options,
        headers,
        credentials: "include",
      });
      if (retry.ok) {
        if (retry.status === 204) return undefined as T;
        return (await retry.json()) as T;
      }
    }
    clearAccessToken();
    throw new ApiError(401, "Session expired. Please log in again.");
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
