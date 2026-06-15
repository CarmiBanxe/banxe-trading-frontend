/**
 * Env-driven sandbox client factory. Defaults to the deterministic mock (no
 * network in dev/CI); "http" targets the internal /api/v1/sandbox surface.
 */

import { createHttpSandboxClient, type SandboxClient } from "./client";
import { createMockSandboxClient } from "./mock-client";

export function buildSandboxClient(): SandboxClient {
  const provider = import.meta.env.VITE_SANDBOX_PROVIDER ?? "mock";
  const apiUrl = import.meta.env.VITE_SANDBOX_API_URL ?? "/api/v1";
  return provider === "http" ? createHttpSandboxClient(apiUrl) : createMockSandboxClient();
}
