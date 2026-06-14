import { describe, it, expect } from "vitest";
import {
  DseClient,
  DseClientError,
  exampleUsage,
  type DseRecommendResponse,
} from "../../src/features/decision-support/partner-sdk-example";

const OK_BODY: DseRecommendResponse = {
  recommendations: [],
  disclaimer: "Advisory only — not investment advice.",
  asOf: "2026-01-01T00:00:00Z",
};

/** Records the last call; returns a canned Response. No network. */
function fakeFetch(status = 200, body: unknown = OK_BODY) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fn = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    } as Response;
  }) as unknown as typeof fetch;
  return { fn, calls };
}

describe("partner DseClient", () => {
  it("posts to {base}/v1/dss/recommend and trims trailing slash", async () => {
    const { fn, calls } = fakeFetch();
    const client = new DseClient({ baseUrl: "https://sandbox.api.banxe.example/", fetchFn: fn });
    await client.recommend({ asset: "BTCUSDT", portfolioValueUsd: "10000" });
    expect(calls[0].url).toBe("https://sandbox.api.banxe.example/v1/dss/recommend");
    expect(calls[0].init?.method).toBe("POST");
  });

  it("sends the Bearer header only when an api key is set", async () => {
    const withKey = fakeFetch();
    await new DseClient({
      baseUrl: "https://sandbox.api.banxe.example",
      apiKey: "abc123",
      fetchFn: withKey.fn,
    }).recommend({ asset: "BTCUSDT", portfolioValueUsd: "10000" });
    const h1 = withKey.calls[0].init?.headers as Record<string, string>;
    expect(h1.authorization).toBe("Bearer abc123");

    const noKey = fakeFetch();
    await new DseClient({
      baseUrl: "https://sandbox.api.banxe.example",
      fetchFn: noKey.fn,
    }).recommend({ asset: "BTCUSDT", portfolioValueUsd: "10000" });
    const h2 = noKey.calls[0].init?.headers as Record<string, string>;
    expect(h2.authorization).toBeUndefined();
  });

  it("serialises the request body as JSON", async () => {
    const { fn, calls } = fakeFetch();
    const client = new DseClient({ baseUrl: "https://sandbox.api.banxe.example", fetchFn: fn });
    await client.recommend({ asset: "ETHUSDT", portfolioValueUsd: "25000", riskProfile: "aggressive" });
    expect(JSON.parse(calls[0].init?.body as string)).toEqual({
      asset: "ETHUSDT",
      portfolioValueUsd: "25000",
      riskProfile: "aggressive",
    });
  });

  it("returns parsed JSON on a 2xx response", async () => {
    const { fn } = fakeFetch(200, OK_BODY);
    const client = new DseClient({ baseUrl: "https://sandbox.api.banxe.example", fetchFn: fn });
    await expect(
      client.recommend({ asset: "BTCUSDT", portfolioValueUsd: "10000" }),
    ).resolves.toEqual(OK_BODY);
  });

  it("throws DseClientError on a non-2xx response", async () => {
    const { fn } = fakeFetch(422, { detail: "bad" });
    const client = new DseClient({ baseUrl: "https://sandbox.api.banxe.example", fetchFn: fn });
    await expect(
      client.recommend({ asset: "BTCUSDT", portfolioValueUsd: "10000" }),
    ).rejects.toBeInstanceOf(DseClientError);
  });

  it("exampleUsage runs against an injected fetch (no network)", async () => {
    const { fn, calls } = fakeFetch();
    await expect(exampleUsage(fn)).resolves.toEqual(OK_BODY);
    expect(calls[0].url).toBe("https://sandbox.api.banxe.example/v1/dss/recommend");
  });
});
