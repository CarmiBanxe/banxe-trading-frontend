/**
 * ExecutionIntentController — fetch an UNSIGNED intent preview into the store.
 *
 * The client is injected (mock by default), so CI runs with no network. This
 * NEVER signs, submits, or executes — it only requests and stores a preview.
 */

import type { ExecutionIntentClient } from "./client";
import type { IntentPreviewRequest, IntentPreviewResponse } from "./types";
import { useExecutionIntentStore } from "./store";
import type { IntentStatus } from "./store";

export interface ExecutionIntentSink {
  setStatus: (status: IntentStatus, error?: string) => void;
  setPreview: (preview: IntentPreviewResponse) => void;
  reset: () => void;
}

export interface ExecutionIntentOptions {
  readonly client: ExecutionIntentClient;
  readonly sink?: ExecutionIntentSink;
}

const DEFAULT_SINK = (): ExecutionIntentSink => useExecutionIntentStore.getState();

export class ExecutionIntentController {
  constructor(private readonly options: ExecutionIntentOptions) {}

  async preview(request: IntentPreviewRequest): Promise<IntentPreviewResponse> {
    const sink = this.sink();
    try {
      sink.setStatus("loading");
      const preview = await this.options.client.preview(request);
      sink.setPreview(preview);
      return preview;
    } catch (err) {
      sink.setStatus("error", err instanceof Error ? err.message : "intent preview failed");
      throw err;
    }
  }

  reset(): void {
    this.sink().reset();
  }

  private sink(): ExecutionIntentSink {
    return this.options.sink ?? DEFAULT_SINK();
  }
}
