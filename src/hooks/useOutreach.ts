import { useState, useCallback } from "react";
import { apiFetch, ApiError } from "../api/client";
import type { DecisionMaker, Company } from "../types";

interface OutreachState {
  generatedText: string;
  isGenerating: boolean;
  error: string | null;
}

interface GenerateParams {
  company: Company | undefined;
  decisionMaker: DecisionMaker | undefined;
  channel: string;
  customPrompt: string;
  serviceType: string;
}

export function useOutreach(initialText: string) {
  const [state, setState] = useState<OutreachState>({
    generatedText: initialText,
    isGenerating: false,
    error: null,
  });

  const generate = useCallback(
    async (params: GenerateParams): Promise<void> => {
      setState((s) => ({ ...s, isGenerating: true, error: null }));
      try {
        const result = await apiFetch<{
          content: string;
          provider: string;
          timestamp: string;
        }>("/generate-outreach", {
          method: "POST",
          body: JSON.stringify({
            companyName: params.company?.name ?? "Unknown",
            industry: params.company?.industry ?? "Unknown",
            executiveName: params.decisionMaker?.name ?? "Unknown",
            role: params.decisionMaker?.role ?? "Unknown",
            channel: params.channel,
            customPrompt: params.customPrompt || undefined,
            details: params.company?.description,
            serviceType: params.serviceType,
          }),
        });
        setState({
          generatedText: result.content,
          isGenerating: false,
          error: null,
        });
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "Failed to generate outreach";
        setState((s) => ({ ...s, isGenerating: false, error: message }));
      }
    },
    [],
  );

  return { ...state, generate };
}
