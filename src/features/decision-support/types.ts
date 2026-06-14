/**
 * DSE types — mirror the backend dse-baas-api / dse-utility-api OpenAPI shapes.
 *
 * Advisory-only (ADR-084). All monetary/metric fields are decimal strings
 * (I-01): the UI formats them but never coerces money to a JS number.
 */

export type ActionType =
  | "BUY"
  | "SELL"
  | "SWAP"
  | "OPEN_LONG"
  | "OPEN_SHORT"
  | "CLOSE"
  | "ADJUST_SL"
  | "STAKE"
  | "REBALANCE"
  | "HEDGE"
  | "HOLD"
  | "WAIT";

export type ActionCategory = "spot" | "perp" | "earn" | "risk" | "meta";

export type RiskProfile = "conservative" | "balanced" | "aggressive" | "custom";

export interface Action {
  readonly type: ActionType;
  readonly category: ActionCategory;
  readonly asset: string;
  readonly description?: string | null;
}

export interface SentimentScore {
  readonly score: string; // S in [-1, 1] (decimal)
  readonly news: string;
  readonly onchain: string;
  readonly social: string;
  readonly modelVersion: string;
}

export interface StressScenario {
  readonly name: string;
  readonly pnlPct: string;
  readonly explanation: string;
}

export interface StressTests {
  readonly base: StressScenario;
  readonly shockDown: StressScenario;
  readonly shockUp: StressScenario;
  readonly blackSwan: StressScenario;
  readonly explanation: string;
}

export interface Recommendation {
  readonly rank: number;
  readonly action: Action;
  readonly utilityScore: string;
  readonly expectedReturnPct: string;
  readonly volatilityPct: string;
  readonly var99Pct: string;
  readonly maxDrawdownPct: string;
  readonly liquidityScore: string;
  readonly kellySizePct: string;
  readonly halfKellySizePct: string;
  readonly sentiment?: SentimentScore | null;
  readonly stressTests?: StressTests | null;
  readonly reasons: string;
}

export interface ModelVersions {
  readonly pricing: string;
  readonly sentiment: string;
  readonly kelly: string;
  readonly stress: string;
}

export interface RecommendRequest {
  readonly asset: string;
  readonly portfolioValueUsd: string;
  readonly riskProfile?: RiskProfile;
  readonly includeStressTests?: boolean;
  readonly includeSentiment?: boolean;
}

export interface RecommendResponse {
  readonly recommendations: readonly Recommendation[];
  readonly sentiment: SentimentScore;
  readonly modelVersions: ModelVersions;
  readonly disclaimer: string;
  readonly asOf: string;
}
