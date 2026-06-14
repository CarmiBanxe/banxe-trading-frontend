/**
 * Decision-support store (Zustand) — holds the latest advisory response.
 *
 * Advisory-only: nothing here executes or signs. The response is held in memory
 * for the widget to render (recommendations + disclaimer).
 */

import { create } from "zustand";
import type { RecommendResponse } from "./types";

export type DseStatus = "idle" | "loading" | "ready" | "error";

export interface DecisionSupportState {
  readonly status: DseStatus;
  readonly response: RecommendResponse | null;
  readonly error: string | null;
  setStatus: (status: DseStatus, error?: string) => void;
  setResponse: (response: RecommendResponse) => void;
  reset: () => void;
}

export const useDecisionSupportStore = create<DecisionSupportState>((set) => ({
  status: "idle",
  response: null,
  error: null,
  setStatus: (status, error) => set({ status, error: error ?? null }),
  setResponse: (response) => set({ response, status: "ready", error: null }),
  reset: () => set({ status: "idle", response: null, error: null }),
}));
