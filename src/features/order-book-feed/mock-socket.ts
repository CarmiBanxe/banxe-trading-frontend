/**
 * Deterministic in-memory socket factory.
 *
 * Used as the default feed transport when no VITE WS URL is configured, so the
 * page renders the same way in dev and CI with NO live network. Emits a fixed
 * snapshot on open, then cycles a fixed diff sequence on a timer. All timers
 * are cleared on close(), so disconnect() fully tears the mock down.
 */

import type { SocketFactory, SocketLike, WsMessage } from "@/shared/api/ws-client";
import type {
  RawOrderBookSnapshot,
  RawOrderBookDiff,
} from "@/entities/order-book";

export const MOCK_SNAPSHOT: RawOrderBookSnapshot = {
  bids: [
    { price: "67250.50", quantity: "1.2500" },
    { price: "67249.00", quantity: "0.8000" },
    { price: "67248.25", quantity: "2.1000" },
    { price: "67247.00", quantity: "0.5500" },
    { price: "67246.50", quantity: "3.0000" },
  ],
  asks: [
    { price: "67251.00", quantity: "0.9000" },
    { price: "67252.50", quantity: "1.5000" },
    { price: "67253.75", quantity: "0.3000" },
    { price: "67254.00", quantity: "2.0000" },
    { price: "67255.50", quantity: "1.1000" },
  ],
  sequence: 1,
};

export const MOCK_DIFFS: readonly RawOrderBookDiff[] = [
  { bids: [{ price: "67250.50", quantity: "0.4000" }], asks: [], sequence: 2 },
  { bids: [], asks: [{ price: "67251.00", quantity: "0.0000" }], sequence: 3 },
  { bids: [{ price: "67250.75", quantity: "1.0000" }], asks: [], sequence: 4 },
];

export interface MockSocketOptions {
  readonly snapshot?: RawOrderBookSnapshot;
  readonly diffs?: readonly RawOrderBookDiff[];
  /** Delay between diff emissions (ms). */
  readonly intervalMs?: number;
}

function emit(socket: SocketLike, msg: WsMessage): void {
  socket.onmessage?.(new MessageEvent("message", { data: JSON.stringify(msg) }));
}

export function createMockSocketFactory(opts: MockSocketOptions = {}): SocketFactory {
  const snapshot = opts.snapshot ?? MOCK_SNAPSHOT;
  const diffs = opts.diffs ?? MOCK_DIFFS;
  const intervalMs = opts.intervalMs ?? 2_000;

  return (_url: string): SocketLike => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const socket: SocketLike = {
      onopen: null,
      onmessage: null,
      onclose: null,
      onerror: null,
      readyState: 0,
      close(): void {
        for (const t of timers) clearTimeout(t);
        timers.length = 0;
        socket.readyState = 3;
      },
    };

    // Defer open to the next tick so the client can attach handlers first
    // (mirrors real WebSocket async open).
    timers.push(
      setTimeout(() => {
        socket.readyState = 1;
        socket.onopen?.(new Event("open"));
        emit(socket, { type: "snapshot", data: snapshot });
        diffs.forEach((diff, i) => {
          timers.push(
            setTimeout(() => emit(socket, { type: "diff", data: diff }), intervalMs * (i + 1)),
          );
        });
      }, 0),
    );

    return socket;
  };
}
