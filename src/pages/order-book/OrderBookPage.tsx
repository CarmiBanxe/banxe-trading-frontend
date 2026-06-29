import { useEffect } from "react";
import {
  OrderBookFeedController,
  createMockSocketFactory,
  useFeedStatusStore,
} from "@/features/order-book-feed";
import { resolveOrderBookWsUrl } from "@/shared/api/trade-proxy";
import { buildDecisionSupportController } from "@/features/decision-support";
import { OrderBookWidget } from "@/widgets/order-book";
import { OrderEntryWidget } from "@/widgets/order-entry";
import { DepthChartWidget } from "@/widgets/depth-chart";
import { DecisionSupportWidget } from "@/widgets/decision-support";

/**
 * Resolve the feed transport. S6.8 wire-not-build: when an explicit per-symbol
 * WS URL is set (VITE_ORDERBOOK_WS_URL) OR the trade-proxy BFF WS base is set
 * (VITE_TRADE_PROXY_WS), bind to the live BFF; otherwise use the deterministic
 * mock socket so dev/CI render with NO network (IL-185 stays the default).
 */
function buildController(): OrderBookFeedController {
  const url = resolveOrderBookWsUrl("BTC-EUR");
  const onStatus = useFeedStatusStore.getState().setStatus;
  if (url) {
    return new OrderBookFeedController({ url, onStatus });
  }
  return new OrderBookFeedController({
    url: "mock://order-book",
    socketFactory: createMockSocketFactory(),
    onStatus,
  });
}

export function OrderBookPage(): JSX.Element {
  useEffect(() => {
    const controller = buildController();
    controller.connect();
    return () => controller.disconnect();
  }, []);

  useEffect(() => {
    // Advisory-only: fetch explainable recommendations (mock by default).
    const dse = buildDecisionSupportController();
    void dse.recommend({ asset: "BTCUSDT", portfolioValueUsd: "10000", riskProfile: "balanced" });
    return () => dse.reset();
  }, []);

  return (
    <div>
      <h1>Trading</h1>
      <div style={{ display: "flex", gap: "1rem" }}>
        <OrderBookWidget />
        <DepthChartWidget />
        <OrderEntryWidget />
      </div>
      <DecisionSupportWidget />
    </div>
  );
}
