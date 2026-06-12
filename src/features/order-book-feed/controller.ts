/**
 * Live order-book feed controller.
 *
 * Wires OrderBookWsClient (shared/api) into the order-book store (entities):
 *   snapshot → applySnapshot, diff → applyDiff.
 *
 * Exposes a coarse connection status (connecting | open | reconnecting |
 * closed) derived from the transport's lower-level status, plus connect() /
 * disconnect(). The socket factory stays injectable so CI/dev never opens a
 * live socket (see mock-socket.ts).
 */

import {
  OrderBookWsClient,
  type SocketFactory,
  type WsMessage,
} from "@/shared/api/ws-client";
import { useOrderBookStore } from "@/entities/order-book";
import type {
  RawOrderBookSnapshot,
  RawOrderBookDiff,
} from "@/entities/order-book";

export type FeedStatus = "connecting" | "open" | "reconnecting" | "closed";

/** Minimal store surface the controller writes into (injectable for tests). */
export interface OrderBookSink {
  applySnapshot: (raw: RawOrderBookSnapshot) => void;
  applyDiff: (raw: RawOrderBookDiff) => void;
  setStatus: (status: "idle" | "loading" | "live" | "error", error?: string) => void;
  reset: () => void;
}

export interface OrderBookFeedOptions {
  /** WS URL; ignored by mock factories but kept for parity with real transport. */
  readonly url: string;
  /** Injected transport. Omit only in production to use the real WebSocket. */
  readonly socketFactory?: SocketFactory;
  /** Notified on every connection-status change. */
  readonly onStatus?: (status: FeedStatus, error?: string) => void;
  /** Store sink; defaults to the live Zustand order-book store. */
  readonly sink?: OrderBookSink;
}

const DEFAULT_SINK = (): OrderBookSink => useOrderBookStore.getState();

export class OrderBookFeedController {
  private client: OrderBookWsClient | null = null;
  private statusValue: FeedStatus = "closed";
  private hasOpened = false;

  constructor(private readonly options: OrderBookFeedOptions) {}

  get status(): FeedStatus {
    return this.statusValue;
  }

  connect(): void {
    if (this.client) return;
    this.hasOpened = false;
    this.sink().setStatus("loading");
    this.client = new OrderBookWsClient(
      this.options.url,
      {
        onMessage: (msg) => this.handleMessage(msg),
        onStatusChange: (status, error) => this.mapStatus(status, error),
      },
      this.options.socketFactory,
    );
    this.client.connect();
  }

  disconnect(): void {
    this.client?.dispose();
    this.client = null;
    this.sink().reset();
    this.setStatus("closed");
  }

  private handleMessage(msg: WsMessage): void {
    const sink = this.sink();
    if (msg.type === "snapshot") {
      sink.applySnapshot(msg.data);
    } else {
      sink.applyDiff(msg.data);
    }
  }

  private mapStatus(
    status: "connecting" | "connected" | "disconnected" | "error",
    error?: string,
  ): void {
    switch (status) {
      case "connecting":
        this.setStatus(this.hasOpened ? "reconnecting" : "connecting");
        break;
      case "connected":
        this.hasOpened = true;
        this.setStatus("open");
        break;
      case "disconnected":
        // Transport auto-schedules a reconnect with backoff.
        this.setStatus("reconnecting", error);
        break;
      case "error":
        this.sink().setStatus("error", error ?? "WebSocket error");
        this.setStatus("reconnecting", error ?? "WebSocket error");
        break;
    }
  }

  private setStatus(status: FeedStatus, error?: string): void {
    this.statusValue = status;
    this.options.onStatus?.(status, error);
  }

  private sink(): OrderBookSink {
    return this.options.sink ?? DEFAULT_SINK();
  }
}
