import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  OrderBookFeedController,
  createMockSocketFactory,
} from "../../src/features/order-book-feed";
import { useOrderBookStore } from "../../src/entities/order-book";
import type {
  SocketLike,
  SocketFactory,
  WsMessage,
} from "../../src/shared/api/ws-client";

function createMockSocket(): SocketLike {
  return {
    onopen: null,
    onmessage: null,
    onclose: null,
    onerror: null,
    close: vi.fn(),
    readyState: 0,
  };
}

function deliver(socket: SocketLike, msg: WsMessage): void {
  socket.onmessage!(new MessageEvent("message", { data: JSON.stringify(msg) }));
}

const SNAPSHOT: WsMessage = {
  type: "snapshot",
  data: {
    bids: [
      { price: "100.00", quantity: "2.0000" },
      { price: "99.00", quantity: "1.0000" },
    ],
    asks: [{ price: "101.00", quantity: "1.5000" }],
    sequence: 1,
  },
};

const DIFF: WsMessage = {
  type: "diff",
  data: {
    bids: [{ price: "100.00", quantity: "0.5000" }],
    asks: [{ price: "101.00", quantity: "0.0000" }],
    sequence: 2,
  },
};

describe("OrderBookFeedController", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useOrderBookStore.getState().reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("applies snapshot then diffs into the order-book store", () => {
    const socket = createMockSocket();
    const factory: SocketFactory = vi.fn(() => socket);
    const controller = new OrderBookFeedController({ url: "ws://t", socketFactory: factory });

    controller.connect();
    expect(useOrderBookStore.getState().status).toBe("loading");

    socket.onopen!(new Event("open"));
    deliver(socket, SNAPSHOT);

    let snap = useOrderBookStore.getState().snapshot;
    expect(snap?.sequence).toBe(1);
    expect(snap?.bids).toHaveLength(2);
    expect(snap?.bids[0].quantity.toFixed(4)).toBe("2.0000");

    deliver(socket, DIFF);
    snap = useOrderBookStore.getState().snapshot;
    expect(snap?.sequence).toBe(2);
    // bid 100 reduced to 0.5; ask 101 removed (qty 0)
    expect(snap?.bids[0].quantity.toFixed(4)).toBe("0.5000");
    expect(snap?.asks).toHaveLength(0);

    controller.disconnect();
  });

  it("transitions connecting → open → reconnecting → open across a drop", () => {
    const sockets: SocketLike[] = [];
    const factory: SocketFactory = vi.fn(() => {
      const s = createMockSocket();
      sockets.push(s);
      return s;
    });
    const seen: string[] = [];
    const controller = new OrderBookFeedController({
      url: "ws://t",
      socketFactory: factory,
      onStatus: (s) => seen.push(s),
    });

    controller.connect();
    sockets[0].onopen!(new Event("open"));
    expect(controller.status).toBe("open");

    // Transport drops → controller reports reconnecting, schedules backoff
    sockets[0].onclose!(new CloseEvent("close"));
    expect(controller.status).toBe("reconnecting");

    vi.advanceTimersByTime(1_000); // backoff fires → new connect()
    expect(factory).toHaveBeenCalledTimes(2);
    sockets[1].onopen!(new Event("open"));
    expect(controller.status).toBe("open");

    // Collapse consecutive duplicates to assert the ordered transitions.
    const collapsed = seen.filter((s, i) => s !== seen[i - 1]);
    expect(collapsed).toEqual(["connecting", "open", "reconnecting", "open"]);

    controller.disconnect();
  });

  it("disconnect closes the socket, resets the store, and stops reconnecting", () => {
    const sockets: SocketLike[] = [];
    const factory: SocketFactory = vi.fn(() => {
      const s = createMockSocket();
      sockets.push(s);
      return s;
    });
    const controller = new OrderBookFeedController({ url: "ws://t", socketFactory: factory });

    controller.connect();
    sockets[0].onopen!(new Event("open"));
    deliver(sockets[0], SNAPSHOT);
    expect(useOrderBookStore.getState().snapshot).not.toBeNull();

    controller.disconnect();
    expect(sockets[0].close).toHaveBeenCalled();
    expect(controller.status).toBe("closed");
    expect(useOrderBookStore.getState().snapshot).toBeNull();
    expect(useOrderBookStore.getState().status).toBe("idle");

    // No reconnect after disconnect.
    vi.advanceTimersByTime(60_000);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("drives the deterministic mock feed into the store", () => {
    const controller = new OrderBookFeedController({
      url: "mock://t",
      socketFactory: createMockSocketFactory({ intervalMs: 1_000 }),
    });

    controller.connect();
    vi.advanceTimersByTime(0); // open + snapshot
    expect(useOrderBookStore.getState().status).toBe("live");
    expect(useOrderBookStore.getState().snapshot?.sequence).toBe(1);

    vi.advanceTimersByTime(3_000); // three scheduled diffs
    expect(useOrderBookStore.getState().snapshot?.sequence).toBe(4);

    controller.disconnect();
  });
});
