/**
 * Advisory action → unsigned-order mapping (T9.2) — mirrors the backend bridge.
 *
 * Pure, deterministic, no network. Tradable actions map to a side + reduce-only;
 * advisory-only actions are not directly tradable. Sizing uses a fixed mock ask
 * (matching the backend mock ExchangePort). NEVER signs or submits.
 */

import Decimal from "decimal.js";
import type { ActionType, Recommendation } from "@/features/decision-support";
import type { IntentPreviewRequest, IntentPreviewResponse, OrderSide } from "./types";

/** Mock ask price (matches the backend InMemoryMockExchange rate). */
export const MOCK_ASK = "67251.00";

const TRADABLE: Partial<Record<ActionType, { side: OrderSide; reduceOnly: boolean }>> = {
  BUY: { side: "buy", reduceOnly: false },
  OPEN_LONG: { side: "buy", reduceOnly: false },
  SELL: { side: "sell", reduceOnly: false },
  OPEN_SHORT: { side: "sell", reduceOnly: false },
  CLOSE: { side: "sell", reduceOnly: true }, // close a long by default; override via side
};

const QUOTES = ["USDT", "USDC", "USD", "DAI", "EUR", "BTC", "ETH"];

export const DISCLAIMER =
  "Sandbox/pre-production preview — UNSIGNED intent only. Nothing is signed, " +
  "submitted, or executed; the backend holds no keys and the client wallet signs " +
  "client-side. Mock data, no live chain. Advisory (self-custodial); NOT an order.";

export function isTradableAction(action: ActionType): boolean {
  return TRADABLE[action] !== undefined;
}

export function splitAsset(asset: string): [string, string] {
  if (asset.includes("-") || asset.includes("/")) {
    const sep = asset.includes("-") ? "-" : "/";
    const [base, quote] = asset.split(sep);
    if (!base || !quote) {
      throw new Error(`cannot split asset ${asset}`);
    }
    return [base.toUpperCase(), quote.toUpperCase()];
  }
  const upper = asset.toUpperCase();
  for (const quote of [...QUOTES].sort((a, b) => b.length - a.length)) {
    if (upper.endsWith(quote) && upper.length > quote.length) {
      return [upper.slice(0, -quote.length), quote];
    }
  }
  throw new Error(`cannot split asset ${asset} into base/quote`);
}

/** Build a deterministic mock preview (used by the mock client). */
export function buildMockPreview(req: IntentPreviewRequest): IntentPreviewResponse {
  const venue = req.venue ?? "mock";
  const mapping = TRADABLE[req.actionType];
  if (!mapping) {
    return {
      tradable: false,
      mode: "sandbox-mock",
      signed: false,
      submitted: false,
      reason: `action ${req.actionType} is advisory-only (not directly tradable)`,
      venue,
      disclaimer: DISCLAIMER,
    };
  }
  if (new Decimal(req.notionalUsd).lte(0)) {
    throw new Error("notionalUsd must be > 0");
  }
  const side = req.side ?? mapping.side;
  const [base, quote] = splitAsset(req.asset);
  const amount = new Decimal(req.notionalUsd).div(MOCK_ASK).toFixed(8);
  return {
    tradable: true,
    mode: "sandbox-mock",
    signed: false,
    submitted: false,
    reason: `unsigned ${side} intent built for ${base}/${quote}`,
    venue,
    order: { baseAsset: base, quoteAsset: quote, side, type: "market", amount, reduceOnly: mapping.reduceOnly },
    intent: { orderId: "mock-preview", state: "accepted", filledAmount: "0", raw: { mock: true } },
    disclaimer: DISCLAIMER,
  };
}

/** Map a DSE recommendation onto an intent-preview request (advice → intent). */
export function fromRecommendation(rec: Recommendation, notionalUsd: string): IntentPreviewRequest {
  return { asset: rec.action.asset, actionType: rec.action.type, notionalUsd };
}
