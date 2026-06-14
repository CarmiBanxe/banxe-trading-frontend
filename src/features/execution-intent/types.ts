/**
 * Execution intent-preview types (T9.2) — mirror the backend internal endpoint
 * POST /api/v1/execution/intent-preview (docs/specs/execution-intent-sandbox.md).
 *
 * SANDBOX / MOCK-ONLY, advisory / pre-production. The preview is an UNSIGNED
 * intent: `signed` and `submitted` are always false. Nothing is signed, sent, or
 * executed (self-custodial). Decimal-string money fields (I-01).
 */

import type { ActionType } from "@/features/decision-support";

export type OrderSide = "buy" | "sell";
export type OrderKind = "market";

export interface IntentPreviewRequest {
  readonly asset: string;
  readonly actionType: ActionType;
  readonly notionalUsd: string;
  readonly venue?: string;
  readonly side?: OrderSide; // optional override (e.g. for CLOSE)
}

export interface MappedOrder {
  readonly baseAsset: string;
  readonly quoteAsset: string;
  readonly side: OrderSide;
  readonly type: OrderKind;
  readonly amount: string;
  readonly reduceOnly: boolean;
}

export interface IntentResult {
  readonly orderId: string;
  readonly state: string;
  readonly filledAmount: string;
  readonly raw?: Record<string, unknown> | null;
}

export interface IntentPreviewResponse {
  readonly tradable: boolean;
  readonly mode: string;
  readonly signed: boolean;
  readonly submitted: boolean;
  readonly reason: string;
  readonly venue: string;
  readonly order?: MappedOrder | null;
  readonly intent?: IntentResult | null;
  readonly disclaimer: string;
}
