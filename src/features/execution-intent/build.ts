/**
 * Env-driven ExecutionIntentController factory.
 *
 * Default `VITE_EXECUTION_PROVIDER` = "mock" → deterministic, no network (dev/CI).
 * "http" calls the INTERNAL backend endpoint at `VITE_EXECUTION_API_URL` (default
 * "/api/v1"). No keys; the preview is always UNSIGNED and never submitted.
 */

import { createHttpExecutionIntentClient } from "./client";
import type { ExecutionIntentClient } from "./client";
import { createMockExecutionIntentClient } from "./mock-client";
import { ExecutionIntentController } from "./controller";

export function buildExecutionIntentController(): ExecutionIntentController {
  const provider = import.meta.env.VITE_EXECUTION_PROVIDER ?? "mock";
  const apiUrl = import.meta.env.VITE_EXECUTION_API_URL ?? "/api/v1";
  const client: ExecutionIntentClient =
    provider === "http" ? createHttpExecutionIntentClient(apiUrl) : createMockExecutionIntentClient();
  return new ExecutionIntentController({ client });
}
