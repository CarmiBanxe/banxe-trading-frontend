/**
 * Order calculators — margin, PNL, liquidation.
 * Ported from IL-154 typeOfOrdersCalculators; all arithmetic via Decimal (I-01).
 */

import { Decimal } from "@/shared/lib/decimal";

export type Side = "long" | "short";

/**
 * Unrealized PNL for an open position.
 * long:  (markPrice - entryPrice) * quantity
 * short: (entryPrice - markPrice) * quantity
 */
export function calculateUnrealizedPnl(
  entryPrice: Decimal,
  markPrice: Decimal,
  quantity: Decimal,
  side: Side,
): Decimal {
  return side === "long"
    ? markPrice.sub(entryPrice).mul(quantity)
    : entryPrice.sub(markPrice).mul(quantity);
}

/**
 * Initial margin required for a position.
 * margin = (entryPrice * quantity) / leverage
 */
export function calculateMarginRequired(
  entryPrice: Decimal,
  quantity: Decimal,
  leverage: Decimal,
): Decimal {
  return entryPrice.mul(quantity).div(leverage);
}

/**
 * Estimated liquidation price (simplified, no funding/fees).
 * long:  entryPrice * (1 - 1/leverage)
 * short: entryPrice * (1 + 1/leverage)
 */
export function calculateLiquidationPrice(
  entryPrice: Decimal,
  leverage: Decimal,
  side: Side,
): Decimal {
  const inverseL = new Decimal("1").div(leverage);
  return side === "long"
    ? entryPrice.mul(new Decimal("1").sub(inverseL))
    : entryPrice.mul(new Decimal("1").add(inverseL));
}
