interface Counters {
  requestsTotal: number;
  requestErrors: number;
  aiCallsTotal: number;
  aiCallsFallback: number;
  aiTokensTotal: number;
}

const counters: Counters = {
  requestsTotal: 0,
  requestErrors: 0,
  aiCallsTotal: 0,
  aiCallsFallback: 0,
  aiTokensTotal: 0,
};

export function incrementRequests(): void {
  counters.requestsTotal++;
}

export function incrementErrors(): void {
  counters.requestErrors++;
}

export function recordAiCall(
  provider: "gemini" | "fallback",
  tokens: number,
): void {
  counters.aiCallsTotal++;
  if (provider === "fallback") counters.aiCallsFallback++;
  counters.aiTokensTotal += tokens;
}

export function getMetrics(): Readonly<Counters> {
  return { ...counters };
}
