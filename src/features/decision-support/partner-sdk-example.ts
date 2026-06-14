/**
 * BANXE DSE advisory client — partner SDK example (T7.4).
 *
 * SELF-CONTAINED and copy-pasteable: partners copy this file into their own
 * project. It is NOT published to NPM and is not imported by the BANXE app
 * (only its unit test imports it).
 *
 * ADVISORY-ONLY (ADR-084 / ADR-085): `POST {baseUrl}/v1/dss/recommend` returns
 * explainable recommendations with Risk/Earn metrics. The DSE never executes
 * orders, signs transactions, or holds keys. Sandbox data is mock/simulated —
 * do not use it in a real-money production path. Recommended UX:
 * recommendation → the user manually confirms and signs in their own wallet.
 * No auto-execution, copy-trading, leaderboards, or other gamification.
 *
 * All monetary/metric fields are decimal strings (never JS numbers).
 */

export type DseRiskProfile = "conservative" | "balanced" | "aggressive" | "custom";

export interface DsePosition {
  readonly asset: string;
  readonly sizeUsd: string;
  readonly side: "long" | "short";
}

export interface DseRecommendRequest {
  readonly asset: string;
  readonly portfolioValueUsd: string;
  readonly riskProfile?: DseRiskProfile;
  readonly currentPositions?: readonly DsePosition[];
  readonly includeStressTests?: boolean;
  readonly includeSentiment?: boolean;
}

export interface DseRiskMetrics {
  readonly greeks: Record<"delta" | "gamma" | "vega" | "theta" | "rho", string>;
  readonly var99Pct: string;
  readonly ddPct: string;
  readonly unrealizedPnlPct: string;
  readonly unrealizedPnlUsd: string;
  readonly liquidityScore: string;
}

export interface DseEarnMetrics {
  readonly currentYieldPct: string;
  readonly protocol: string;
  readonly chain: string;
  readonly lockupDays: number;
  readonly variableRate: boolean;
  readonly riskSummary: string;
}

export interface DseRecommendation {
  readonly rank: number;
  readonly action: { readonly type: string; readonly category: string; readonly asset: string };
  readonly utilityScore: string;
  readonly halfKellySizePct: string;
  readonly riskMetrics: DseRiskMetrics;
  readonly earnMetrics?: DseEarnMetrics | null;
  readonly reasons: string;
}

export interface DseRecommendResponse {
  readonly recommendations: readonly DseRecommendation[];
  readonly disclaimer: string;
  readonly asOf: string;
}

export interface DseClientOptions {
  /** e.g. https://sandbox.api.banxe.example (sandbox returns mock data) */
  readonly baseUrl: string;
  /** Sandbox key; a placeholder like "YOUR_KEY_HERE" works against mock. */
  readonly apiKey?: string;
  /** Injected for tests; defaults to the global fetch. */
  readonly fetchFn?: typeof fetch;
}

export class DseClientError extends Error {}

/** Thin advisory client over POST {baseUrl}/v1/dss/recommend. */
export class DseClient {
  private readonly base: string;
  private readonly apiKey: string;
  private readonly fetchFn: typeof fetch;

  constructor(opts: DseClientOptions) {
    this.base = opts.baseUrl.replace(/\/$/, "");
    this.apiKey = opts.apiKey ?? "";
    this.fetchFn = opts.fetchFn ?? globalThis.fetch;
  }

  async recommend(request: DseRecommendRequest): Promise<DseRecommendResponse> {
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (this.apiKey) {
      headers.authorization = `Bearer ${this.apiKey}`;
    }
    const resp = await this.fetchFn(`${this.base}/v1/dss/recommend`, {
      method: "POST",
      headers,
      body: JSON.stringify(request),
    });
    if (!resp.ok) {
      throw new DseClientError(`dss/recommend failed: ${resp.status}`);
    }
    return (await resp.json()) as DseRecommendResponse;
  }
}

/**
 * Usage example (partners copy this). Advisory-only: render the result and let
 * the user confirm manually — never auto-execute.
 */
export async function exampleUsage(fetchFn?: typeof fetch): Promise<DseRecommendResponse> {
  const client = new DseClient({
    baseUrl: "https://sandbox.api.banxe.example",
    apiKey: "YOUR_KEY_HERE", // sample sandbox placeholder — replace with yours
    fetchFn,
  });
  return client.recommend({
    asset: "BTCUSDT",
    portfolioValueUsd: "10000",
    riskProfile: "balanced",
    includeSentiment: true,
  });
}
