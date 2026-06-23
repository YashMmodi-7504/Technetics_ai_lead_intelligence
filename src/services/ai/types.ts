// Shared types for the AI service: result envelope, errors, cost tracking and
// the minimal model interface the service depends on (for dependency
// injection in unit tests).

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AIResult<T> {
  data: T;
  provider: "gemini" | "fallback";
  model: string;
  promptId: string;
  promptVersion: string;
  usage: TokenUsage;
  latencyMs: number;
  timestamp: string;
}

// Cost-tracking hook. Invoked once per completed AI call (success or fallback)
// so callers can log spend, emit metrics, or persist usage rows.
export interface CostEvent {
  promptId: string;
  promptVersion: string;
  model: string;
  provider: "gemini" | "fallback";
  usage: TokenUsage;
  latencyMs: number;
  timestamp: string;
}

export type CostTracker = (event: CostEvent) => void;

export class AIValidationError extends Error {
  constructor(
    message: string,
    public readonly raw: string,
  ) {
    super(message);
    this.name = "AIValidationError";
  }
}

export class AITimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`AI call timed out after ${timeoutMs}ms`);
    this.name = "AITimeoutError";
  }
}

// Minimal shape of the Gemini model client we depend on. Lets unit tests
// inject a fake without importing the SDK.
export interface GenerateContentParams {
  model: string;
  contents: string;
  config?: Record<string, unknown>;
}

export interface GenerateContentResponse {
  text?: string;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

export interface ModelClient {
  models: {
    generateContent(
      params: GenerateContentParams,
    ): Promise<GenerateContentResponse>;
  };
}
