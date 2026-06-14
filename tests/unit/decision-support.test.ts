import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  DecisionSupportController,
  createMockDseClient,
  createHttpDseClient,
  useDecisionSupportStore,
} from "../../src/features/decision-support";
import type { DseClient } from "../../src/features/decision-support";

describe("createMockDseClient (default, no network)", () => {
  it("returns deterministic ranked advisory with a disclaimer", async () => {
    const resp = await createMockDseClient().recommend({
      asset: "BTCUSDT",
      portfolioValueUsd: "10000",
    });
    expect(resp.disclaimer).toMatch(/Advisory only/);
    expect(resp.recommendations.map((r) => r.rank)).toEqual([1, 2, 3, 4]);
    expect(resp.recommendations[0].action.asset).toBe("BTCUSDT");
    // Decimal strings (I-01) — never coerced to number.
    expect(typeof resp.recommendations[0].halfKellySizePct).toBe("string");
  });
});

describe("DecisionSupportController (mock client → store)", () => {
  beforeEach(() => {
    useDecisionSupportStore.getState().reset();
  });

  it("loads recommendations into the store", async () => {
    const ctrl = new DecisionSupportController({ client: createMockDseClient() });
    await ctrl.recommend({ asset: "BTCUSDT", portfolioValueUsd: "10000" });
    const state = useDecisionSupportStore.getState();
    expect(state.status).toBe("ready");
    expect(state.response?.recommendations.length).toBe(4);
  });

  it("surfaces a client error and stores no response", async () => {
    const failing: DseClient = {
      recommend: vi.fn(async () => {
        throw new Error("dss/recommend failed: 503");
      }),
    };
    const ctrl = new DecisionSupportController({ client: failing });
    await expect(
      ctrl.recommend({ asset: "BTCUSDT", portfolioValueUsd: "10000" }),
    ).rejects.toThrow(/503/);
    const state = useDecisionSupportStore.getState();
    expect(state.status).toBe("error");
    expect(state.response).toBeNull();
  });

  it("reset clears the store", async () => {
    const ctrl = new DecisionSupportController({ client: createMockDseClient() });
    await ctrl.recommend({ asset: "BTCUSDT", portfolioValueUsd: "10000" });
    ctrl.reset();
    expect(useDecisionSupportStore.getState().status).toBe("idle");
  });
});

describe("createHttpDseClient (injected fetch, no network)", () => {
  it("POSTs to /dss/recommend and parses the response", async () => {
    const payload = {
      recommendations: [],
      sentiment: { score: "0.1", news: "0", onchain: "0", social: "0", modelVersion: "x" },
      modelVersions: { pricing: "p", sentiment: "s", kelly: "k", stress: "st" },
      disclaimer: "Advisory only.",
      asOf: "t",
    };
    const fetchFn = vi.fn(async () =>
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const client = createHttpDseClient("http://api.test/api/v1", fetchFn as typeof fetch);
    const resp = await client.recommend({ asset: "BTCUSDT", portfolioValueUsd: "10000" });
    expect(resp.disclaimer).toBe("Advisory only.");
    expect(fetchFn).toHaveBeenCalledWith(
      "http://api.test/api/v1/dss/recommend",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("throws on a non-200 response", async () => {
    const fetchFn = vi.fn(async () => new Response("err", { status: 503 }));
    const client = createHttpDseClient("http://api.test/api/v1", fetchFn as typeof fetch);
    await expect(
      client.recommend({ asset: "BTCUSDT", portfolioValueUsd: "10000" }),
    ).rejects.toThrow(/503/);
  });
});
