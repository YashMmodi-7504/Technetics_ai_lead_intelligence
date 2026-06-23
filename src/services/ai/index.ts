// Barrel export + default singleton. Routes import `aiService` from here.
import { AIService } from "./AIService.js";
import { recordAiCall } from "../metrics.js";
import type { CostEvent } from "./types.js";

const defaultCostTracker = (event: CostEvent) => {
  console.log(
    `[ai-cost] prompt=${event.promptId} v=${event.promptVersion} model=${event.model} ` +
      `provider=${event.provider} tokens=${event.usage.totalTokens} latency=${event.latencyMs}ms`,
  );
  recordAiCall(event.provider, event.usage.totalTokens);
};

export const aiService = new AIService({ costTracker: defaultCostTracker });

export { AIService } from "./AIService.js";
export * from "./types.js";
export * from "./schemas.js";
export * from "./prompts.js";
export { DEFAULT_MODEL } from "./constants.js";
