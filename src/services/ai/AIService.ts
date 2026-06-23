// The single AIService. All Gemini access in the platform routes through this
// class. Model client and cost tracker are injectable for unit testing.
import type { z } from "zod";
import { getGeminiClient } from "./client.js";
import { DEFAULT_MODEL } from "./constants.js";
import {
  prompts,
  PROMPT_VERSION,
  type OutreachPromptInput,
  type ScorePromptInput,
} from "./prompts.js";
import {
  leadScoreSchema,
  countryAnalysisSchema,
  companyAnalysisSchema,
  countryDemandSchema,
  type CountryAnalysisResult,
  type CompanyAnalysisResult,
  type CountryDemandResult,
} from "./schemas.js";
import {
  fallbackOutreach,
  fallbackLeadScoreRecommendations,
  computeAverageScore,
} from "./fallbacks.js";
import {
  AITimeoutError,
  AIValidationError,
  type AIResult,
  type CostTracker,
  type ModelClient,
  type TokenUsage,
} from "./types.js";

export interface AIServiceOptions {
  model?: string;
  timeoutMs?: number;
  maxRetries?: number;
  costTracker?: CostTracker;
  // Injectable client (defaults to the shared Gemini client). null => fallback.
  client?: ModelClient | null;
}

const ZERO_USAGE: TokenUsage = {
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(err: unknown): boolean {
  if (err instanceof AIValidationError) return false;
  const status = (err as { status?: number })?.status;
  // Retry on rate limits, timeouts and 5xx; not on 4xx client errors.
  if (status && status >= 400 && status < 500 && status !== 429) return false;
  return true;
}

export class AIService {
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly costTracker?: CostTracker;
  private readonly explicitClient?: ModelClient | null;

  constructor(opts: AIServiceOptions = {}) {
    this.model = opts.model ?? DEFAULT_MODEL;
    this.timeoutMs = opts.timeoutMs ?? 20_000;
    this.maxRetries = opts.maxRetries ?? 2;
    this.costTracker = opts.costTracker;
    this.explicitClient = opts.client;
  }

  // Resolve the model client: explicit injection wins; otherwise shared client.
  private resolveClient(): ModelClient | null {
    if (this.explicitClient !== undefined) return this.explicitClient;
    return getGeminiClient() as ModelClient | null;
  }

  private extractUsage(raw: {
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      totalTokenCount?: number;
    };
  }): TokenUsage {
    const u = raw.usageMetadata;
    if (!u) return { ...ZERO_USAGE };
    const promptTokens = u.promptTokenCount ?? 0;
    const completionTokens = u.candidatesTokenCount ?? 0;
    return {
      promptTokens,
      completionTokens,
      totalTokens: u.totalTokenCount ?? promptTokens + completionTokens,
    };
  }

  private emit(event: {
    promptId: string;
    provider: "gemini" | "fallback";
    usage: TokenUsage;
    latencyMs: number;
    timestamp: string;
  }) {
    if (!this.costTracker) return;
    try {
      this.costTracker({
        ...event,
        promptVersion: PROMPT_VERSION,
        model: this.model,
      });
    } catch (err) {
      console.error("[AIService] cost tracker threw:", err);
    }
  }

  // Core: one model call wrapped in timeout + retry/backoff.
  private async callModel(
    client: ModelClient,
    contents: string,
    config?: Record<string, unknown>,
  ): Promise<{ text: string; usage: TokenUsage }> {
    let lastErr: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.withTimeout(
          client.models.generateContent({
            model: this.model,
            contents,
            config,
          }),
        );
        return {
          text: response.text ?? "",
          usage: this.extractUsage(response),
        };
      } catch (err) {
        lastErr = err;
        if (!isRetryable(err) || attempt === this.maxRetries) break;
        await sleep(2 ** attempt * 250); // 250ms, 500ms, ...
      }
    }
    throw lastErr;
  }

  private withTimeout<T>(promise: Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new AITimeoutError(this.timeoutMs)),
        this.timeoutMs,
      );
      promise.then(
        (v) => {
          clearTimeout(timer);
          resolve(v);
        },
        (e) => {
          clearTimeout(timer);
          reject(e);
        },
      );
    });
  }

  // Generic structured-output helper: JSON mode + Zod validation.
  private async generateStructured<T>(
    client: ModelClient,
    contents: string,
    schema: z.ZodType<T>,
  ): Promise<{ data: T; usage: TokenUsage }> {
    const { text, usage } = await this.callModel(client, contents, {
      responseMimeType: "application/json",
    });
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(text.trim());
    } catch {
      throw new AIValidationError("Model returned non-JSON output", text);
    }
    const result = schema.safeParse(parsedJson);
    if (!result.success) {
      throw new AIValidationError(
        `Schema validation failed: ${result.error.message}`,
        text,
      );
    }
    return { data: result.data, usage };
  }

  /* --------------------------- public API --------------------------- */

  async generateOutreach(
    input: OutreachPromptInput,
  ): Promise<AIResult<{ content: string }>> {
    const start = Date.now();
    const promptId = "outreach";
    const client = this.resolveClient();
    if (client) {
      try {
        const { text, usage } = await this.callModel(
          client,
          prompts.outreach(input),
          { temperature: 0.8, topP: 0.9 },
        );
        if (text.trim()) {
          return this.finish(promptId, "gemini", { content: text }, usage, start);
        }
      } catch (err) {
        console.error("[AIService.generateOutreach] falling back:", err);
      }
    }
    return this.finish(
      promptId,
      "fallback",
      { content: fallbackOutreach(input) },
      { ...ZERO_USAGE },
      start,
    );
  }

  async scoreLead(
    input: ScorePromptInput,
  ): Promise<AIResult<{ score: number; recommendations: string[] }>> {
    const start = Date.now();
    const promptId = "leadScore";
    const score = computeAverageScore(input);
    const client = this.resolveClient();
    if (client) {
      try {
        const { data, usage } = await this.generateStructured(
          client,
          prompts.leadScore(input),
          leadScoreSchema,
        );
        return this.finish(
          promptId,
          "gemini",
          { score, recommendations: data.recommendations },
          usage,
          start,
        );
      } catch (err) {
        console.error("[AIService.scoreLead] falling back:", err);
      }
    }
    return this.finish(
      promptId,
      "fallback",
      { score, recommendations: fallbackLeadScoreRecommendations(input) },
      { ...ZERO_USAGE },
      start,
    );
  }

  async analyzeCountry(
    name: string,
  ): Promise<AIResult<CountryAnalysisResult> | null> {
    const start = Date.now();
    const client = this.resolveClient();
    if (!client) return null;
    try {
      const { data, usage } = await this.generateStructured(
        client,
        prompts.countryAnalysis(name),
        countryAnalysisSchema,
      );
      return this.finish("countryAnalysis", "gemini", data, usage, start);
    } catch (err) {
      console.error("[AIService.analyzeCountry] failed:", err);
      return null;
    }
  }

  async analyzeCompany(
    name: string,
    domain: string,
    industry: string,
  ): Promise<AIResult<CompanyAnalysisResult> | null> {
    const start = Date.now();
    const client = this.resolveClient();
    if (!client) return null;
    try {
      const { data, usage } = await this.generateStructured(
        client,
        prompts.companyAnalysis(name, domain, industry),
        companyAnalysisSchema,
      );
      return this.finish("companyAnalysis", "gemini", data, usage, start);
    } catch (err) {
      console.error("[AIService.analyzeCompany] failed:", err);
      return null;
    }
  }

  // Country demand across the 8 skill dimensions. Returns null when no client
  // is configured so callers can apply a deterministic baseline.
  async analyzeCountryDemand(
    name: string,
  ): Promise<AIResult<CountryDemandResult> | null> {
    const start = Date.now();
    const client = this.resolveClient();
    if (!client) return null;
    try {
      const { data, usage } = await this.generateStructured(
        client,
        prompts.countryDemand(name),
        countryDemandSchema,
      );
      return this.finish("countryDemand", "gemini", data, usage, start);
    } catch (err) {
      console.error("[AIService.analyzeCountryDemand] failed:", err);
      return null;
    }
  }

  private finish<T>(
    promptId: string,
    provider: "gemini" | "fallback",
    data: T,
    usage: TokenUsage,
    start: number,
  ): AIResult<T> {
    const latencyMs = Date.now() - start;
    const timestamp = new Date().toISOString();
    this.emit({ promptId, provider, usage, latencyMs, timestamp });
    return {
      data,
      provider,
      model: this.model,
      promptId,
      promptVersion: PROMPT_VERSION,
      usage,
      latencyMs,
      timestamp,
    };
  }
}
