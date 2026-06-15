// FSD feature — internal sandbox portal client (read-only over /api/v1/sandbox/*).
export type {
  Badge,
  GamificationState,
  PartnerProfile,
  PartnersResponse,
  SandboxStatus,
  ScenarioSummary,
  ScenariosResponse,
  SessionSummary,
  SessionsResponse,
} from "./types";
export type { GamificationEvent, SandboxClient } from "./client";
export { createHttpSandboxClient } from "./client";
export { createMockSandboxClient } from "./mock-client";
export { buildSandboxClient } from "./build";
