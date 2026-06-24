// Centralized API base URL — the single source of truth for where the frontend
// sends requests. In production (Vercel) there is no co-located API, so calls
// must target the Railway backend. Override per-environment with VITE_API_URL
// (e.g. set it to http://localhost:3000 for local same-origin development).
export const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://techneticsaileadintelligence-production.up.railway.app";
