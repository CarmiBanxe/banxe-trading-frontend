/**
 * Typed shapes for the internal sandbox API (GET /api/v1/sandbox/*).
 *
 * Read-only, advisory/mock surface — these mirror the backend SBOX-1..5 responses.
 * No money fields here; where the backend uses decimal strings elsewhere they stay
 * strings (I-01). `unknown` is used for the opaque demo step payloads (never `any`).
 */

export interface SandboxStatus {
  readonly mode: string;
  readonly advisoryModules: readonly string[];
  readonly executionMode: string;
  readonly liveProvidersEnabled: boolean;
  readonly billingEnabled: boolean;
  readonly kybEnabled: boolean;
  readonly lineageEnabled: boolean;
  readonly disclaimer: string;
}

export interface ScenarioSummary {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly tags: readonly string[];
}

export interface ScenariosResponse {
  readonly scenarios: readonly ScenarioSummary[];
}

export interface ScenarioStep {
  readonly id: string;
  readonly kind: string;
  readonly title: string;
  readonly description: string;
  readonly payload: Readonly<Record<string, unknown>>;
}

export interface ScenarioDetail {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly steps: readonly ScenarioStep[];
  readonly tags: readonly string[];
}

export interface SessionStepRef {
  readonly scenarioId: string | null;
  readonly stepId: string | null;
  readonly layer: string;
  readonly lineageEventId: string | null;
}

export interface SessionSummary {
  readonly id: string;
  readonly startedAt: string;
  readonly finishedAt: string | null;
  readonly scenarioId: string | null;
  readonly title: string;
  readonly description: string;
  readonly steps: readonly SessionStepRef[];
  readonly notes: string | null;
}

export interface SessionsResponse {
  readonly sessions: readonly SessionSummary[];
}

export interface PartnerProfile {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly segment: string;
  readonly region: string;
  readonly useCase: string;
  readonly enabledModules: readonly string[];
  readonly sampleRateLimitTier: string;
  readonly disclaimer: string;
}

export interface PartnersResponse {
  readonly partners: readonly PartnerProfile[];
}

export interface Badge {
  readonly id: string;
  readonly title: string;
  readonly description: string;
}

export interface GamificationState {
  readonly profileId: string | null;
  readonly completedScenarios: readonly string[];
  readonly completedSessions: number;
  readonly badges: readonly Badge[];
  readonly streak: { readonly current: number; readonly best: number };
}
