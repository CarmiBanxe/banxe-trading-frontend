/**
 * DSE client — talks to the backend advisory endpoint.
 *
 * Injectable `fetch` so CI never hits the network. Advisory-only: the response
 * is explainable guidance; the user signs any resulting transaction themselves.
 *   POST {base}/dss/recommend → RecommendResponse
 */

import type { RecommendRequest, RecommendResponse } from "./types";

export interface DseClient {
  recommend(request: RecommendRequest): Promise<RecommendResponse>;
}

export function createHttpDseClient(
  baseUrl: string,
  fetchFn: typeof fetch = globalThis.fetch,
): DseClient {
  const base = baseUrl.replace(/\/$/, "");
  return {
    async recommend(request: RecommendRequest): Promise<RecommendResponse> {
      const resp = await fetchFn(`${base}/dss/recommend`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
      });
      if (!resp.ok) {
        throw new Error(`dss/recommend failed: ${resp.status}`);
      }
      return (await resp.json()) as RecommendResponse;
    },
  };
}
