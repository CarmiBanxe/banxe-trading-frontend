import { useEffect } from "react";
import {
  OrderBookFeedController,
  createMockSocketFactory,
  useFeedStatusStore,
} from "@/features/order-book-feed";
import { OrderBookWidget } from "@/widgets/order-book";
import { OrderEntryWidget } from "@/widgets/order-entry";
import { DepthChartWidget } from "@/widgets/depth-chart";

/**
 * Resolve the feed transport: a real WebSocket when a VITE WS URL is provided,
 * otherwise a deterministic mock so dev/CI render without a live socket.
 */
function buildController(): OrderBookFeedController {
  const url = import.meta.env.VITE_ORDERBOOK_WS_URL;
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

  return (
    <div>
      <h1>Trading</h1>
      <div style={{ display: "flex", gap: "1rem" }}>
        <OrderBookWidget />
        <DepthChartWidget />
        <OrderEntryWidget />
      </div>
    </div>
  );
}
