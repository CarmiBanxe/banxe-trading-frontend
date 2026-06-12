/**
 * Thin adapter around lightweight-charts (Apache-2.0, ADR-082).
 *
 * The widget depends only on these interfaces, so the chart library is fully
 * mockable in tests — no real canvas/DOM chart runs in CI. The default
 * implementation is the only place that imports lightweight-charts.
 */

import {
  createChart,
  AreaSeries,
  type IChartApi,
  type ISeriesApi,
  type AreaData,
  type UTCTimestamp,
} from "lightweight-charts";
import type { DepthPoint } from "@/entities/order-book";

/** Live chart instance the widget drives. */
export interface DepthChartHandle {
  setDepth: (bids: readonly DepthPoint[], asks: readonly DepthPoint[]) => void;
  destroy: () => void;
}

/** Factory the widget receives (injectable; defaults to lightweight-charts). */
export interface DepthChartAdapter {
  create: (container: HTMLElement) => DepthChartHandle;
}

const BID_COLOR = "#26a69a";
const ASK_COLOR = "#ef5350";

/** Map depth points to area data, sorted ascending by price (chart x-axis). */
function toAreaData(points: readonly DepthPoint[]): AreaData<UTCTimestamp>[] {
  return points
    .map((p) => ({ time: p.price as UTCTimestamp, value: p.cumulative }))
    .sort((a, b) => (a.time as number) - (b.time as number));
}

export const lightweightChartsAdapter: DepthChartAdapter = {
  create(container: HTMLElement): DepthChartHandle {
    const chart: IChartApi = createChart(container, {
      height: 220,
      width: container.clientWidth || 360,
      timeScale: { timeVisible: false },
    });
    const bidSeries: ISeriesApi<"Area"> = chart.addSeries(AreaSeries, {
      lineColor: BID_COLOR,
      topColor: BID_COLOR,
      bottomColor: "rgba(38,166,154,0.1)",
    });
    const askSeries: ISeriesApi<"Area"> = chart.addSeries(AreaSeries, {
      lineColor: ASK_COLOR,
      topColor: ASK_COLOR,
      bottomColor: "rgba(239,83,80,0.1)",
    });

    return {
      setDepth(bids, asks): void {
        bidSeries.setData(toAreaData(bids));
        askSeries.setData(toAreaData(asks));
      },
      destroy(): void {
        chart.remove();
      },
    };
  },
};
