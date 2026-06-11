import { useOrderBookStore } from "@/entities/order-book";
import type { PriceLevel } from "@/entities/order-book";

function PriceLevelRow({ level, side }: { level: PriceLevel; side: "bid" | "ask" }): JSX.Element {
  return (
    <tr data-testid={`${side}-row`}>
      <td>{level.price.toFixed(2)}</td>
      <td>{level.quantity.toFixed(4)}</td>
    </tr>
  );
}

export function OrderBookWidget(): JSX.Element {
  const snapshot = useOrderBookStore((s) => s.snapshot);
  const status = useOrderBookStore((s) => s.status);
  const error = useOrderBookStore((s) => s.error);

  if (status === "error") {
    return <div data-testid="ob-error">Error: {error ?? "unknown"}</div>;
  }

  if (status === "loading" || status === "idle") {
    return <div data-testid="ob-loading">Loading order book…</div>;
  }

  if (!snapshot || (snapshot.bids.length === 0 && snapshot.asks.length === 0)) {
    return <div data-testid="ob-empty">No orders</div>;
  }

  return (
    <div data-testid="ob-live">
      <table>
        <thead>
          <tr><th colSpan={2}>Bids</th></tr>
          <tr><th>Price</th><th>Qty</th></tr>
        </thead>
        <tbody>
          {snapshot.bids.map((b, i) => (
            <PriceLevelRow key={i} level={b} side="bid" />
          ))}
        </tbody>
      </table>
      <table>
        <thead>
          <tr><th colSpan={2}>Asks</th></tr>
          <tr><th>Price</th><th>Qty</th></tr>
        </thead>
        <tbody>
          {snapshot.asks.map((a, i) => (
            <PriceLevelRow key={i} level={a} side="ask" />
          ))}
        </tbody>
      </table>
    </div>
  );
}
