/**
 * Execution intent-preview store (Zustand) — holds the latest UNSIGNED preview.
 *
 * Nothing here signs, submits, or executes. The preview is held in memory for the
 * widget to render (PREVIEW ONLY / NOT EXECUTED).
 */

import { create } from "zustand";
import type { IntentPreviewResponse } from "./types";

export type IntentStatus = "idle" | "loading" | "ready" | "error";

export interface ExecutionIntentState {
  readonly status: IntentStatus;
  readonly preview: IntentPreviewResponse | null;
  readonly error: string | null;
  setStatus: (status: IntentStatus, error?: string) => void;
  setPreview: (preview: IntentPreviewResponse) => void;
  reset: () => void;
}

export const useExecutionIntentStore = create<ExecutionIntentState>((set) => ({
  status: "idle",
  preview: null,
  error: null,
  setStatus: (status, error) => set({ status, error: error ?? null }),
  setPreview: (preview) => set({ preview, status: "ready", error: null }),
  reset: () => set({ status: "idle", preview: null, error: null }),
}));
