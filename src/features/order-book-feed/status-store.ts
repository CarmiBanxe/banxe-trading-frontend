/**
 * Connection-status store for the live order-book feed.
 *
 * Separate from the order-book *data* status (entities/order-book): this
 * tracks transport health (connecting | open | reconnecting | closed) so the
 * widget can show a small indicator without coupling to the data store.
 */

import { create } from "zustand";
import type { FeedStatus } from "./controller";

export interface FeedStatusState {
  readonly status: FeedStatus;
  readonly lastError: string | null;
  setStatus: (status: FeedStatus, error?: string) => void;
}

export const useFeedStatusStore = create<FeedStatusState>((set) => ({
  status: "closed",
  lastError: null,
  setStatus: (status, error) => set({ status, lastError: error ?? null }),
}));
