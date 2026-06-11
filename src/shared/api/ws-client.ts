/**
 * Typed WebSocket client with reconnect/backoff.
 * Env-driven URL (no secrets). Injectable socket factory for testing.
 */

import type { RawOrderBookSnapshot, RawOrderBookDiff } from "@/entities/order-book";

export type WsMessage =
  | { type: "snapshot"; data: RawOrderBookSnapshot }
  | { type: "diff"; data: RawOrderBookDiff };

export interface WsClientCallbacks {
  onMessage: (msg: WsMessage) => void;
  onStatusChange: (status: "connecting" | "connected" | "disconnected" | "error", error?: string) => void;
}

export interface SocketLike {
  onopen: ((ev: Event) => void) | null;
  onmessage: ((ev: MessageEvent) => void) | null;
  onclose: ((ev: CloseEvent) => void) | null;
  onerror: ((ev: Event) => void) | null;
  close(): void;
  readyState: number;
}

export type SocketFactory = (url: string) => SocketLike;

const DEFAULT_FACTORY: SocketFactory = (url) => new WebSocket(url) as SocketLike;

const MAX_BACKOFF_MS = 30_000;
const BASE_BACKOFF_MS = 1_000;

export class OrderBookWsClient {
  private socket: SocketLike | null = null;
  private attempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;

  constructor(
    private readonly url: string,
    private readonly callbacks: WsClientCallbacks,
    private readonly createSocket: SocketFactory = DEFAULT_FACTORY,
  ) {}

  connect(): void {
    if (this.disposed) return;
    this.callbacks.onStatusChange("connecting");
    this.socket = this.createSocket(this.url);

    this.socket.onopen = () => {
      this.attempt = 0;
      this.callbacks.onStatusChange("connected");
    };

    this.socket.onmessage = (ev: MessageEvent) => {
      try {
        const parsed = JSON.parse(String(ev.data)) as WsMessage;
        if (parsed.type === "snapshot" || parsed.type === "diff") {
          this.callbacks.onMessage(parsed);
        }
      } catch {
        // ignore malformed messages
      }
    };

    this.socket.onclose = () => {
      if (this.disposed) return;
      this.callbacks.onStatusChange("disconnected");
      this.scheduleReconnect();
    };

    this.socket.onerror = () => {
      this.callbacks.onStatusChange("error", "WebSocket error");
    };
  }

  dispose(): void {
    this.disposed = true;
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.socket?.close();
    this.socket = null;
  }

  /** Visible for testing. */
  getBackoffMs(): number {
    return Math.min(BASE_BACKOFF_MS * 2 ** this.attempt, MAX_BACKOFF_MS);
  }

  private scheduleReconnect(): void {
    const delay = this.getBackoffMs();
    this.attempt += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }
}
