import { useEffect, useRef } from "react";
import { useOrderBookStore, cumulativeDepth } from "@/entities/order-book";
import { lightweightChartsAdapter } from "./chart-adapter";
import type { DepthChartAdapter, DepthChartHandle } from "./chart-adapter";

export interface DepthChartWidgetProps {
  /** Injectable chart adapter; defaults to the lightweight-charts adapter. */
  readonly adapter?: DepthChartAdapter;
}

export function DepthChartWidget({
  adapter = lightweightChartsAdapter,
}: DepthChartWidgetProps): JSX.Element {
  const snapshot = useOrderBookStore((s) => s.snapshot);
  const status = useOrderBookStore((s) => s.status);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<DepthChartHandle | null>(null);

  // Create/destroy the chart with the container's lifetime.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handle = adapter.create(container);
    handleRef.current = handle;
    return () => {
      handle.destroy();
      handleRef.current = null;
    };
  }, [adapter]);

  // Push new depth whenever the snapshot changes.
  useEffect(() => {
    if (!snapshot || !handleRef.current) return;
    const { bids, asks } = cumulativeDepth(snapshot);
    handleRef.current.setDepth(bids, asks);
  }, [snapshot]);

  const isEmpty =
    !snapshot || (snapshot.bids.length === 0 && snapshot.asks.length === 0);
  const note =
    status === "loading" || status === "idle"
      ? { testid: "depth-loading", text: "Loading depth…" }
      : isEmpty
        ? { testid: "depth-empty", text: "No depth" }
        : null;

  return (
    <div data-testid="depth-widget">
      <h3>Depth</h3>
      {note && <div data-testid={note.testid}>{note.text}</div>}
      <div
        data-testid="depth-chart"
        ref={containerRef}
        style={{ width: 360, height: 220 }}
      />
    </div>
  );
}
