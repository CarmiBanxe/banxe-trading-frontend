/**
 * Execution intent-preview client (T9.2) — internal terminal endpoint.
 *
 * Injectable `fetch` so CI never hits the network. The endpoint is INTERNAL
 * (POST {base}/execution/intent-preview); it builds an UNSIGNED intent only —
 * it never signs or submits. Not the external /v1 BaaS facade.
 */

import type { IntentPreviewRequest, IntentPreviewResponse } from "./types";

export interface ExecutionIntentClient {
  preview(request: IntentPreviewRequest): Promise<IntentPreviewResponse>;
}

export function createHttpExecutionIntentClient(
  baseUrl: string,
  fetchFn: typeof fetch = globalThis.fetch,
): ExecutionIntentClient {
  const base = baseUrl.replace(/\/$/, "");
  return {
    async preview(request: IntentPreviewRequest): Promise<IntentPreviewResponse> {
      const resp = await fetchFn(`${base}/execution/intent-preview`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
      });
      if (!resp.ok) {
        throw new Error(`execution/intent-preview failed: ${resp.status}`);
      }
      return (await resp.json()) as IntentPreviewResponse;
    },
  };
}
