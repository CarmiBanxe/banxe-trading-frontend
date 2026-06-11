import { useMemo } from "react";
import { useOrderBookStore } from "@/entities/order-book";
import {
  useOrderEntryStore,
  computeDerived,
  validatePrice,
  validateQuantity,
  validateLeverage,
} from "@/features/order-entry";
import type { Side } from "@/features/order-calculators";

export function OrderEntryWidget(): JSX.Element {
  const side = useOrderEntryStore((s) => s.side);
  const entryPrice = useOrderEntryStore((s) => s.entryPrice);
  const quantity = useOrderEntryStore((s) => s.quantity);
  const leverage = useOrderEntryStore((s) => s.leverage);
  const setSide = useOrderEntryStore((s) => s.setSide);
  const setEntryPrice = useOrderEntryStore((s) => s.setEntryPrice);
  const setQuantity = useOrderEntryStore((s) => s.setQuantity);
  const setLeverage = useOrderEntryStore((s) => s.setLeverage);

  const snapshot = useOrderBookStore((s) => s.snapshot);
  const obStatus = useOrderBookStore((s) => s.status);

  const bestBid = snapshot?.bids[0]?.price ?? null;
  const bestAsk = snapshot?.asks[0]?.price ?? null;
  const markPrice = side === "long"
    ? bestAsk?.toString() ?? null
    : bestBid?.toString() ?? null;

  const derived = useMemo(
    () => computeDerived({ entryPrice, quantity, leverage, side, markPrice }),
    [entryPrice, quantity, leverage, side, markPrice],
  );

  const priceVal = validatePrice(entryPrice);
  const qtyVal = validateQuantity(quantity);
  const levVal = validateLeverage(leverage);

  if (obStatus === "idle" || obStatus === "loading") {
    return <div data-testid="oe-loading">Waiting for market data…</div>;
  }

  const handlePrefill = (): void => {
    const price = side === "long"
      ? bestAsk?.toString()
      : bestBid?.toString();
    if (price) setEntryPrice(price);
  };

  return (
    <div data-testid="oe-form">
      <div>
        <label>
          Side:
          <select
            data-testid="oe-side"
            value={side}
            onChange={(e) => setSide(e.target.value as Side)}
          >
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
        </label>
      </div>

      <div>
        <label>
          Entry Price:
          <input
            data-testid="oe-price"
            type="text"
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
          />
        </label>
        <button data-testid="oe-prefill" type="button" onClick={handlePrefill}>
          Best {side === "long" ? "Ask" : "Bid"}
        </button>
        {!priceVal.valid && entryPrice && (
          <span data-testid="oe-price-error">{priceVal.error}</span>
        )}
      </div>

      <div>
        <label>
          Quantity:
          <input
            data-testid="oe-qty"
            type="text"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </label>
        {!qtyVal.valid && quantity && (
          <span data-testid="oe-qty-error">{qtyVal.error}</span>
        )}
      </div>

      <div>
        <label>
          Leverage:
          <input
            data-testid="oe-leverage"
            type="text"
            value={leverage}
            onChange={(e) => setLeverage(e.target.value)}
          />
        </label>
        {!levVal.valid && (
          <span data-testid="oe-lev-error">{levVal.error}</span>
        )}
      </div>

      <div data-testid="oe-computed">
        <div data-testid="oe-margin">
          Margin: {derived.margin?.toFixed(2) ?? "—"}
        </div>
        <div data-testid="oe-pnl">
          PNL: {derived.pnl?.toFixed(2) ?? "—"}
        </div>
        <div data-testid="oe-liquidation">
          Liq: {derived.liquidation?.toFixed(2) ?? "—"}
        </div>
      </div>
    </div>
  );
}
