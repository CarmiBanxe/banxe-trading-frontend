/**
 * DecisionSupportController — fetch advisory recommendations into the store.
 *
 * The DseClient is injected (mock by default), so CI runs with no network.
 * Advisory-only (ADR-084): this requests and stores explainable guidance; it
 * never executes or signs.
 */

import type { DseClient } from "./client";
import type { RecommendRequest, RecommendResponse } from "./types";
import { useDecisionSupportStore } from "./store";
import type { DseStatus } from "./store";

export interface DecisionSupportSink {
  setStatus: (status: DseStatus, error?: string) => void;
  setResponse: (response: RecommendResponse) => void;
  reset: () => void;
}

export interface DecisionSupportOptions {
  readonly client: DseClient;
  readonly sink?: DecisionSupportSink;
}

const DEFAULT_SINK = (): DecisionSupportSink => useDecisionSupportStore.getState();

export class DecisionSupportController {
  constructor(private readonly options: DecisionSupportOptions) {}

  async recommend(request: RecommendRequest): Promise<RecommendResponse> {
    const sink = this.sink();
    try {
      sink.setStatus("loading");
      const response = await this.options.client.recommend(request);
      sink.setResponse(response);
      return response;
    } catch (err) {
      sink.setStatus("error", err instanceof Error ? err.message : "advisory request failed");
      throw err;
    }
  }

  reset(): void {
    this.sink().reset();
  }

  private sink(): DecisionSupportSink {
    return this.options.sink ?? DEFAULT_SINK();
  }
}
