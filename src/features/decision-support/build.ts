/**
 * Env-driven DecisionSupportController factory.
 *
 * Default `VITE_DSE_PROVIDER` = "mock" → deterministic, no network (dev/CI).
 * "http" calls the backend advisory endpoint at `VITE_DSE_API_URL` (default
 * "/api/v1"). Switching to the real backend is purely an env decision — no keys.
 */

import { createHttpDseClient } from "./client";
import type { DseClient } from "./client";
import { createMockDseClient } from "./mock-client";
import { DecisionSupportController } from "./controller";

export function buildDecisionSupportController(): DecisionSupportController {
  const provider = import.meta.env.VITE_DSE_PROVIDER ?? "mock";
  const apiUrl = import.meta.env.VITE_DSE_API_URL ?? "/api/v1";
  const client: DseClient =
    provider === "http" ? createHttpDseClient(apiUrl) : createMockDseClient();
  return new DecisionSupportController({ client });
}
