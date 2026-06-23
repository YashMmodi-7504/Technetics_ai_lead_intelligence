// Centralized error responder: logs full detail server-side, returns a safe
// generic message to the client (no internal leakage). Pass a 4xx status for
// client-safe messages that may be surfaced verbatim.
import type { Response } from "express";

export function sendError(
  res: Response,
  error: unknown,
  context: string,
): void {
  console.error(`[${context}]`, error);
  res.status(500).json({ error: "Internal server error" });
}

export const LEAD_STATUSES = [
  "New Leads",
  "Qualified",
  "Contacted",
  "Meeting Scheduled",
  "Proposal Sent",
  "Negotiation",
  "Won",
  "Lost",
] as const;

export function isValidLeadStatus(value: unknown): boolean {
  return (
    typeof value === "string" &&
    (LEAD_STATUSES as readonly string[]).includes(value)
  );
}

export interface PaginationParams {
  limit: number;
  offset: number;
}

export function parsePagination(
  query: Record<string, unknown>,
): PaginationParams {
  const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 100);
  const offset = Math.max(Number(query.offset) || 0, 0);
  return { limit, offset };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: { limit: number; offset: number; total: number };
}
