import { describe, it, expect, vi } from "vitest";
import { AIService } from "../AIService";
import type {
  ModelClient,
  CostEvent,
  GenerateContentResponse,
} from "../types";
import { AITimeoutError } from "../types";

// Helper to build a fake ModelClient with a programmable generateContent.
function fakeClient(
  impl: (params: { contents: string }) => Promise<GenerateContentResponse>,
): ModelClient {
  return { models: { generateContent: vi.fn(impl) } };
}

const scoreInput = {
  companyName: "Acme",
  dataScience: 80,
  powerBI: 60,
  cloud: 70,
  automation: 50,
  buyingIntent: 90,
};

describe("AIService.scoreLead", () => {
  it("returns validated recommendations on success and computes the average", async () => {
    const client = fakeClient(async () => ({
      text: JSON.stringify({ recommendations: ["a", "b", "c"] }),
      usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 },
    }));
    const svc = new AIService({ client });
    const res = await svc.scoreLead(scoreInput);

    expect(res.provider).toBe("gemini");
    expect(res.data.recommendations).toEqual(["a", "b", "c"]);
    expect(res.data.score).toBe(70); // (80+60+70+50+90)/5
    expect(res.usage.totalTokens).toBe(15);
  });

  it("falls back when the model returns invalid JSON", async () => {
    const client = fakeClient(async () => ({ text: "not json" }));
    const svc = new AIService({ client, maxRetries: 0 });
    const res = await svc.scoreLead(scoreInput);

    expect(res.provider).toBe("fallback");
    expect(res.data.recommendations.length).toBe(3);
    expect(res.data.score).toBe(70);
  });

  it("falls back when the schema does not match", async () => {
    const client = fakeClient(async () => ({
      text: JSON.stringify({ wrong: true }),
    }));
    const svc = new AIService({ client, maxRetries: 0 });
    const res = await svc.scoreLead(scoreInput);
    expect(res.provider).toBe("fallback");
  });

  it("uses fallback when no client is configured", async () => {
    const svc = new AIService({ client: null });
    const res = await svc.scoreLead(scoreInput);
    expect(res.provider).toBe("fallback");
  });
});

describe("AIService retry behaviour", () => {
  it("retries retryable errors then succeeds", async () => {
    let calls = 0;
    const client = fakeClient(async () => {
      calls++;
      if (calls < 2) {
        const err = new Error("503") as Error & { status: number };
        err.status = 503;
        throw err;
      }
      return { text: JSON.stringify({ recommendations: ["x"] }) };
    });
    const svc = new AIService({ client, maxRetries: 2 });
    const res = await svc.scoreLead(scoreInput);
    expect(calls).toBe(2);
    expect(res.provider).toBe("gemini");
  });

  it("does not retry non-retryable 4xx and falls back", async () => {
    let calls = 0;
    const client = fakeClient(async () => {
      calls++;
      const err = new Error("400") as Error & { status: number };
      err.status = 400;
      throw err;
    });
    const svc = new AIService({ client, maxRetries: 3 });
    const res = await svc.scoreLead(scoreInput);
    expect(calls).toBe(1);
    expect(res.provider).toBe("fallback");
  });
});

describe("AIService timeout", () => {
  it("times out a slow call and falls back", async () => {
    const client = fakeClient(
      () => new Promise(() => {}), // never resolves
    );
    const svc = new AIService({ client, timeoutMs: 20, maxRetries: 0 });
    const res = await svc.scoreLead(scoreInput);
    expect(res.provider).toBe("fallback");
  });

  it("AITimeoutError is constructed with the timeout", () => {
    const e = new AITimeoutError(123);
    expect(e.message).toContain("123");
  });
});

describe("AIService cost tracking", () => {
  it("emits one cost event per call with usage and latency", async () => {
    const events: CostEvent[] = [];
    const client = fakeClient(async () => ({
      text: JSON.stringify({ recommendations: ["a"] }),
      usageMetadata: { totalTokenCount: 42 },
    }));
    const svc = new AIService({
      client,
      costTracker: (e) => events.push(e),
    });
    await svc.scoreLead(scoreInput);

    expect(events).toHaveLength(1);
    expect(events[0].promptId).toBe("leadScore");
    expect(events[0].provider).toBe("gemini");
    expect(events[0].usage.totalTokens).toBe(42);
    expect(events[0].model).toBe("gemini-2.5-flash");
  });
});

describe("AIService.generateOutreach", () => {
  it("returns model text when available", async () => {
    const client = fakeClient(async () => ({ text: "Hi there" }));
    const svc = new AIService({ client });
    const res = await svc.generateOutreach({ channel: "linkedin" });
    expect(res.provider).toBe("gemini");
    expect(res.data.content).toBe("Hi there");
  });

  it("falls back to a template when the model returns empty text", async () => {
    const client = fakeClient(async () => ({ text: "" }));
    const svc = new AIService({ client });
    const res = await svc.generateOutreach({
      channel: "email",
      companyName: "Acme",
    });
    expect(res.provider).toBe("fallback");
    expect(res.data.content).toContain("Acme");
  });
});
