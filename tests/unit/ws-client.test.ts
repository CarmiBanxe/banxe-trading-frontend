import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OrderBookWsClient } from "../../src/shared/api/ws-client";
import type { SocketLike, SocketFactory, WsMessage, WsClientCallbacks } from "../../src/shared/api/ws-client";

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

describe("OrderBookWsClient", () => {
  let mockSocket: SocketLike;
  let factory: SocketFactory;
  let callbacks: WsClientCallbacks;
  let onMessage: ReturnType<typeof vi.fn>;
  let onStatusChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockSocket = createMockSocket();
    factory = vi.fn(() => mockSocket);
    onMessage = vi.fn();
    onStatusChange = vi.fn();
    callbacks = { onMessage, onStatusChange };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("connects and reports status", () => {
    const client = new OrderBookWsClient("ws://test", callbacks, factory);
    client.connect();

    expect(factory).toHaveBeenCalledWith("ws://test");
    expect(onStatusChange).toHaveBeenCalledWith("connecting");

    // Simulate open
    mockSocket.onopen!(new Event("open"));
    expect(onStatusChange).toHaveBeenCalledWith("connected");

    client.dispose();
  });

  it("parses snapshot messages", () => {
    const client = new OrderBookWsClient("ws://test", callbacks, factory);
    client.connect();
    mockSocket.onopen!(new Event("open"));

    const msg: WsMessage = {
      type: "snapshot",
      data: { bids: [{ price: "100", quantity: "5" }], asks: [], sequence: 1 },
    };
    mockSocket.onmessage!(new MessageEvent("message", { data: JSON.stringify(msg) }));

    expect(onMessage).toHaveBeenCalledWith(msg);
    client.dispose();
  });

  it("parses diff messages", () => {
    const client = new OrderBookWsClient("ws://test", callbacks, factory);
    client.connect();
    mockSocket.onopen!(new Event("open"));

    const msg: WsMessage = {
      type: "diff",
      data: { bids: [], asks: [{ price: "101", quantity: "3" }], sequence: 2 },
    };
    mockSocket.onmessage!(new MessageEvent("message", { data: JSON.stringify(msg) }));

    expect(onMessage).toHaveBeenCalledWith(msg);
    client.dispose();
  });

  it("ignores malformed messages", () => {
    const client = new OrderBookWsClient("ws://test", callbacks, factory);
    client.connect();
    mockSocket.onopen!(new Event("open"));

    mockSocket.onmessage!(new MessageEvent("message", { data: "not json" }));
    expect(onMessage).not.toHaveBeenCalled();
    client.dispose();
  });

  it("reconnects with exponential backoff on close", () => {
    const sockets: SocketLike[] = [];
    const factoryMulti: SocketFactory = vi.fn(() => {
      const s = createMockSocket();
      sockets.push(s);
      return s;
    });

    const client = new OrderBookWsClient("ws://test", callbacks, factoryMulti);
    client.connect();

    // First connect
    expect(factoryMulti).toHaveBeenCalledTimes(1);

    // Close triggers reconnect after 1s
    sockets[0].onclose!(new CloseEvent("close"));
    expect(onStatusChange).toHaveBeenCalledWith("disconnected");

    vi.advanceTimersByTime(999);
    expect(factoryMulti).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1);
    expect(factoryMulti).toHaveBeenCalledTimes(2);

    // Second close → 2s backoff
    sockets[1].onclose!(new CloseEvent("close"));
    vi.advanceTimersByTime(1999);
    expect(factoryMulti).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(1);
    expect(factoryMulti).toHaveBeenCalledTimes(3);

    client.dispose();
  });

  it("resets backoff after successful connection", () => {
    const sockets: SocketLike[] = [];
    const factoryMulti: SocketFactory = vi.fn(() => {
      const s = createMockSocket();
      sockets.push(s);
      return s;
    });

    const client = new OrderBookWsClient("ws://test", callbacks, factoryMulti);
    client.connect();

    // Close and reconnect
    sockets[0].onclose!(new CloseEvent("close"));
    vi.advanceTimersByTime(1000);
    expect(factoryMulti).toHaveBeenCalledTimes(2);

    // Successful connection resets attempt counter
    sockets[1].onopen!(new Event("open"));

    // Close again — backoff should be 1s again (not 2s)
    sockets[1].onclose!(new CloseEvent("close"));
    vi.advanceTimersByTime(1000);
    expect(factoryMulti).toHaveBeenCalledTimes(3);

    client.dispose();
  });

  it("caps backoff at 30s", () => {
    const client = new OrderBookWsClient("ws://test", callbacks, factory);
    // Simulate many attempts
    for (let i = 0; i < 20; i++) {
      client.connect();
      mockSocket.onclose!(new CloseEvent("close"));
      vi.runAllTimers();
    }
    expect(client.getBackoffMs()).toBeLessThanOrEqual(30_000);
    client.dispose();
  });

  it("does not reconnect after dispose", () => {
    const client = new OrderBookWsClient("ws://test", callbacks, factory);
    client.connect();
    client.dispose();

    expect(mockSocket.close).toHaveBeenCalled();

    // Attempt connect after dispose — should not create socket
    const callsBefore = (factory as ReturnType<typeof vi.fn>).mock.calls.length;
    client.connect();
    expect((factory as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsBefore);
  });

  it("reports error on socket error", () => {
    const client = new OrderBookWsClient("ws://test", callbacks, factory);
    client.connect();
    mockSocket.onerror!(new Event("error"));

    expect(onStatusChange).toHaveBeenCalledWith("error", "WebSocket error");
    client.dispose();
  });
});
