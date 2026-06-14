/**
 * Deterministic mock execution-intent client — the DEFAULT for dev/CI. No network.
 *
 * Mirrors the backend bridge: maps an advisory action to an UNSIGNED intent
 * (signed:false, submitted:false) or marks it advisory-only. Nothing executes.
 */

import type { ExecutionIntentClient } from "./client";
import type { IntentPreviewRequest, IntentPreviewResponse } from "./types";
import { buildMockPreview } from "./map";

export function createMockExecutionIntentClient(): ExecutionIntentClient {
  return {
    async preview(request: IntentPreviewRequest): Promise<IntentPreviewResponse> {
      return buildMockPreview(request);
    },
  };
}
