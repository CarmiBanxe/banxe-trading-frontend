/**
 * Deterministic mock DSE client — the DEFAULT for dev/CI. No network.
 *
 * Mirrors the backend MockDseEngine shape (advisory-only): a small ranked set
 * with utility, Half-Kelly sizing, mock sentiment + stress, and the MiCA/MiFID
 * advisory disclaimer. Values are decimal strings (I-01).
 */

import type { DseClient } from "./client";
import type {
  EarnMetrics,
  Recommendation,
  RecommendRequest,
  RecommendResponse,
  RiskMetrics,
  SentimentScore,
} from "./types";

function riskMetrics(delta: string, var99: string, pnlPct: string, pnlUsd: string): RiskMetrics {
  return {
    greeks: { delta, gamma: "0.02", vega: "0", theta: "-0.01", rho: "0.02" },
    var99Pct: var99,
    ddPct: "4.0000",
    unrealizedPnlPct: pnlPct,
    unrealizedPnlUsd: pnlUsd,
    liquidityScore: "0.9500",
  };
}

const EARN_BTC: EarnMetrics = {
  currentYieldPct: "3.5000",
  protocol: "mock-stakekit",
  chain: "ethereum",
  lockupDays: 7,
  variableRate: true,
  riskSummary: "Wrapped/liquid staking; smart-contract + slashing risk.",
};

const DISCLAIMER =
  "Advisory only — not investment advice and not an execution or " +
  "portfolio-management service. BANXE DSE provides explainable model estimates " +
  "(mock data in this build); you retain custody and sign all transactions " +
  "yourself. Per MiCA / MiFID II this is decision-support output.";

const SENTIMENT: SentimentScore = {
  score: "0.35",
  news: "0.40",
  onchain: "0.30",
  social: "0.35",
  modelVersion: "mock-sentiment-0.1.0",
};

function rec(
  rank: number,
  type: Recommendation["action"]["type"],
  category: Recommendation["action"]["category"],
  asset: string,
  utility: string,
  halfKelly: string,
  reasons: string,
): Recommendation {
  const earn = category === "earn" ? EARN_BTC : null;
  return {
    rank,
    action: { type, category, asset },
    utilityScore: utility,
    expectedReturnPct: "6.0000",
    volatilityPct: "3.0000",
    var99Pct: "6.9789",
    maxDrawdownPct: "4.0000",
    liquidityScore: "0.9500",
    kellySizePct: (Number(halfKelly) * 2).toFixed(4),
    halfKellySizePct: halfKelly,
    riskMetrics: riskMetrics(
      category === "perp" ? "1.0" : category === "earn" ? "0.2" : "1.0",
      "6.9789",
      "0.8000",
      "80.00",
    ),
    earnMetrics: earn,
    sentiment: SENTIMENT,
    stressTests: {
      base: { name: "base", pnlPct: "0.0000", explanation: "Baseline; no shock." },
      shockDown: { name: "shockDown", pnlPct: "-20.0000", explanation: "Price −20%." },
      shockUp: { name: "shockUp", pnlPct: "20.0000", explanation: "Price +20%." },
      blackSwan: { name: "blackSwan", pnlPct: "-50.0000", explanation: "Price −50%." },
      explanation: "Deterministic mock stress scenarios.",
    },
    reasons,
  };
}

export function createMockDseClient(): DseClient {
  return {
    recommend(request: RecommendRequest): Promise<RecommendResponse> {
      const asset = request.asset;
      const recommendations: Recommendation[] = [
        rec(1, "HOLD", "meta", asset, "1.000000", "0.0000", "Maintain current exposure; no new risk. VaR99 0%, delta 0."),
        rec(2, "BUY", "spot", asset, "0.900000", "9.6667", "Spot accumulation; high liquidity. VaR99 6.9789%, delta 1.0."),
        rec(3, "STAKE", "earn", asset, "0.642000", "0.0000", "Yield above without extra risk. VaR99 2.3263%, delta 0.2. Yield 3.5000% (mock-stakekit, ethereum)."),
        rec(4, "OPEN_LONG", "perp", asset, "0.620000", "12.5000", "Positive ER with leverage; Half-Kelly. VaR99 9.3052%, delta 1.0."),
      ];
      return Promise.resolve({
        recommendations,
        sentiment: SENTIMENT,
        modelVersions: {
          pricing: "mock-pricing-0.1.0",
          sentiment: "mock-sentiment-0.1.0",
          kelly: "kelly-0.1.0",
          stress: "mock-stress-0.1.0",
        },
        disclaimer: DISCLAIMER,
        asOf: "2026-01-01T00:00:00Z",
      });
    },
  };
}
