import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  OrderBookFeedController,
  useFeedStatusStore,
} from "../../src/features/order-book-feed";
import type { FeedStatus } from "../../src/features/order-book-feed";
import { useOrderBookStore } from "../../src/entities/order-book";
import type { SocketLike, SocketFactory } from "../../src/shared/api/ws-client";

/**
 * Captured §D2 envelope sequence — the VERBATIM wire output of the backend's
 * `InMemoryMockMarketData`
 * (banxe-trading-backend: src/banxe_trading_backend/ports/market_data_port.py),
 * captured 2026-06-12 via:
 *
 *   WsSnapshotMessage(data=md.get_snapshot("BTC-EUR")).model_dump(by_alias=True)
 *   WsDiffMessage(data=diff).model_dump(by_alias=True)
 *
 * This is the real backend §D2 contract sample (decimal strings, snapshot then
 * diffs, strictly-increasing sequence, delete-on-zero) — NOT invented. The test
 * pushes these through the SAME path the production real-WS adapter uses
 * (OrderBookWsClient JSON.parse -> OrderBookFeedController -> order-book store);
 * only the socket transport is scripted, so there is NO network.
 */
const BACKEND_D2_ENVELOPES = [
  {
    type: "snapshot",
    data: {
      bids: [
        { price: "67250.50", quantity: "1.2500" },
        { price: "67249.00", quantity: "0.8000" },
      ],
      asks: [
        { price: "67251.00", quantity: "0.9000" },
        { price: "67252.50", quantity: "1.5000" },
      ],
      sequence: 1,
    },
  },
  {
    type: "diff",
    data: { bids: [{ price: "67250.50", quantity: "0.4000" }], asks: [], sequence: 2 },
  },
  {
    type: "diff",
    data: { bids: [], asks: [{ price: "67251.00", quantity: "0.0000" }], sequence: 3 },
  },
  {
    type: "diff",
    data: { bids: [{ price: "67250.75", quantity: "1.0000" }], asks: [], sequence: 4 },
  },
] as const;

interface ScriptedSocket {
  factory: SocketFactory;
  open: () => void;
  send: (envelope: unknown) => void;
  socket: () => SocketLike;
}

function scriptedSocket(): ScriptedSocket {
  let current: SocketLike;
  const factory: SocketFactory = () => {
    current = {
      onopen: null,
      onmessage: null,
      onclose: null,
      onerror: null,
      close: vi.fn(),
      readyState: 0,
    };
    return current;
  };
  return {
    factory,
    open: () => {
      current.readyState = 1;
      current.onopen?.(new Event("open"));
    },
    // Serialized exactly as a real WebSocket delivers it: ev.data is a JSON string.
    send: (envelope) =>
      current.onmessage?.(new MessageEvent("message", { data: JSON.stringify(envelope) })),
    socket: () => current,
  };
}

describe("FE ↔ backend §D2 WS contract (captured backend envelope, no network)", () => {
  beforeEach(() => {
    useOrderBookStore.getState().reset();
    useFeedStatusStore.getState().setStatus("closed");
  });

  it("applies the captured backend snapshot+diffs to the expected store state", () => {
    const s = scriptedSocket();
    const statuses: FeedStatus[] = [];
    const controller = new OrderBookFeedController({
      url: "wss://backend.example/ws/orderbook/BTC-EUR",
      socketFactory: s.factory,
      onStatus: (st) => statuses.push(st),
    });

    controller.connect();
    expect(useOrderBookStore.getState().status).toBe("loading");

    s.open();
    for (const envelope of BACKEND_D2_ENVELOPES) s.send(envelope);

    const snap = useOrderBookStore.getState().snapshot;
    expect(snap).not.toBeNull();
    expect(snap!.sequence).toBe(4);
    // bids descending; 67250.50 reduced to 0.4000 (diff 2), 67250.75 added (diff 4)
    expect(snap!.bids.map((b) => [b.price.toFixed(2), b.quantity.toFixed(4)])).toEqual([
      ["67250.75", "1.0000"],
      ["67250.50", "0.4000"],
      ["67249.00", "0.8000"],
    ]);
    // 67251.00 deleted via quantity "0.0000" (diff 3); 67252.50 remains
    expect(snap!.asks.map((a) => [a.price.toFixed(2), a.quantity.toFixed(4)])).toEqual([
      ["67252.50", "1.5000"],
    ]);
    expect(useOrderBookStore.getState().status).toBe("live");

    // Connection status drove connecting -> open through the feed controller.
    const collapsed = statuses.filter((st, i) => st !== statuses[i - 1]);
    expect(collapsed).toEqual(["connecting", "open"]);

    controller.disconnect();
    expect(s.socket().close).toHaveBeenCalled();
    expect(controller.status).toBe("closed");
  });

  it("drops a stale/duplicate diff (sequence <= current) per §D2 sequence semantics", () => {
    const s = scriptedSocket();
    const controller = new OrderBookFeedController({
      url: "wss://backend.example/ws/orderbook/BTC-EUR",
      socketFactory: s.factory,
    });
    controller.connect();
    s.open();
    s.send(BACKEND_D2_ENVELOPES[0]); // snapshot seq 1
    s.send(BACKEND_D2_ENVELOPES[1]); // diff seq 2 -> applied
    s.send(BACKEND_D2_ENVELOPES[1]); // replay seq 2 (stale) -> must be ignored

    const snap = useOrderBookStore.getState().snapshot!;
    expect(snap.sequence).toBe(2);
    expect(
      snap.bids.find((b) => b.price.toFixed(2) === "67250.50")!.quantity.toFixed(4),
    ).toBe("0.4000");

    controller.disconnect();
  });

  it("decimal strings survive the wire round-trip (I-01: no float coercion)", () => {
    const s = scriptedSocket();
    const controller = new OrderBookFeedController({
      url: "wss://backend.example/ws/orderbook/BTC-EUR",
      socketFactory: s.factory,
    });
    controller.connect();
    s.open();
    s.send(BACKEND_D2_ENVELOPES[0]);

    const snap = useOrderBookStore.getState().snapshot!;
    // Exact decimal fidelity preserved end-to-end (Decimal-backed, never float).
    expect(snap.bids[0].price.toFixed(2)).toBe("67250.50");
    expect(snap.bids[0].quantity.toFixed(4)).toBe("1.2500");

    controller.disconnect();
  });
});
