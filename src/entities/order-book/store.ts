/**
 * Zustand store for order-book state.
 * Consumes existing pure snapshot/diff functions. No React in entity layer.
 */

import { create } from "zustand";
import type { OrderBookSnapshot, RawOrderBookSnapshot, RawOrderBookDiff } from "./types";
import { parseSnapshot, parseDiff, applyDiff } from "./pure";

const DEFAULT_TOP_N = 10;

export interface OrderBookState {
  readonly snapshot: OrderBookSnapshot | null;
  readonly topN: number;
  readonly status: "idle" | "loading" | "live" | "error";
  readonly error: string | null;
  applySnapshot: (raw: RawOrderBookSnapshot) => void;
  applyDiff: (raw: RawOrderBookDiff) => void;
  setStatus: (status: OrderBookState["status"], error?: string) => void;
  reset: () => void;
}

function trimToTopN(snap: OrderBookSnapshot, n: number): OrderBookSnapshot {
  return {
    bids: snap.bids.slice(0, n),
    asks: snap.asks.slice(0, n),
    sequence: snap.sequence,
  };
}

export const useOrderBookStore = create<OrderBookState>((set, get) => ({
  snapshot: null,
  topN: DEFAULT_TOP_N,
  status: "idle",
  error: null,

  applySnapshot: (raw: RawOrderBookSnapshot) => {
    const parsed = parseSnapshot(raw);
    set({ snapshot: trimToTopN(parsed, get().topN), status: "live", error: null });
  },

  applyDiff: (raw: RawOrderBookDiff) => {
    const { snapshot, topN } = get();
    if (!snapshot) return;
    const diff = parseDiff(raw);
    if (diff.sequence <= snapshot.sequence) return;
    const updated = applyDiff(snapshot, diff);
    set({ snapshot: trimToTopN(updated, topN) });
  },

  setStatus: (status, error) => {
    set({ status, error: error ?? null });
  },

  reset: () => {
    set({ snapshot: null, status: "idle", error: null });
  },
}));
