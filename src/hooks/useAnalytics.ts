import { useMemo } from "react";
import type { Company } from "../types";
import { computeAnalytics, type Analytics } from "../utils/analytics";

/**
 * Memoized centralized analytics. Every dashboard widget can read from this one
 * derived source of truth; it recomputes automatically whenever the underlying
 * company records change (e.g. after a CSV import triggers a refetch).
 */
export function useAnalytics(companies: Company[]): Analytics {
  return useMemo(() => computeAnalytics(companies), [companies]);
}
