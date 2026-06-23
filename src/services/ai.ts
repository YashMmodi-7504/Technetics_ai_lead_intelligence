// Back-compat shim. The single source of truth is src/services/ai/.
// Existing imports of getGeminiClient continue to work.
export { getGeminiClient } from "./ai/client.js";
export { aiService, AIService } from "./ai/index.js";
