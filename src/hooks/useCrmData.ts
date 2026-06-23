import { useCallback, useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useAuth } from "./useAuth.js";
import { fetchCompanies, fetchCountries } from "../api/crm";
import type { Company, CountryOpportunity } from "../types";

export interface CrmData {
  companies: Company[];
  countries: CountryOpportunity[];
  loading: boolean;
  error: string | null;
  setCompanies: Dispatch<SetStateAction<Company[]>>;
  setCountries: Dispatch<SetStateAction<CountryOpportunity[]>>;
  refetch: () => Promise<void>;
}

export function useCrmData(): CrmData {
  const { isAuthenticated } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [countries, setCountries] = useState<CountryOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [c, co] = await Promise.all([fetchCompanies(), fetchCountries()]);
      setCompanies(c);
      setCountries(co);
    } catch (err: any) {
      setError(err?.message || "Failed to load company data");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refetch();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, refetch]);

  return { companies, countries, loading, error, setCompanies, setCountries, refetch };
}
