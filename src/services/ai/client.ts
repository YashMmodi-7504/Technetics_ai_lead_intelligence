// Single lazy GoogleGenAI initializer. Replaces the duplicate clients that
// previously lived in server.ts (getGeminiClient) and services/ai.ts (getAI).
import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

function isUsableKey(key: string | undefined): key is string {
  return !!key && key !== "MY_GEMINI_API_KEY" && key.trim() !== "";
}

/**
 * Returns a shared GoogleGenAI client, or null when no usable key is
 * configured. Returning null (rather than throwing) lets callers fall back to
 * the local template engine gracefully.
 */
export function getGeminiClient(): GoogleGenAI | null {
  if (client) return client;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!isUsableKey(apiKey)) {
    return null;
  }
  try {
    client = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "technetics-platform" } },
    });
    return client;
  } catch (err) {
    console.error("[ai/client] Failed to initialize GoogleGenAI:", err);
    return null;
  }
}

// Test seam: allow tests to reset the memoized client.
export function __resetGeminiClient() {
  client = null;
}
