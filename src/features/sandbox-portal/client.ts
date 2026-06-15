/**
 * HTTP client for the internal sandbox API (read-only GET /api/v1/sandbox/*).
 *
 * Only reads the sandbox surface — it NEVER calls /v1/orders* or any live endpoint.
 * The one write is an opt-in demo gamification event (POST), used only by the portal
 * to drive the educational badges in a demo run.
 */

import type {
  GamificationState,
  PartnersResponse,
  SandboxStatus,
  ScenariosResponse,
  SessionsResponse,
} from "./types";

export interface GamificationEvent {
  readonly profileId?: string;
  readonly eventType: "SCENARIO_COMPLETED" | "SESSION_REPLAY_VIEWED";
  readonly scenarioId?: string;
  readonly sessionId?: string;
}

export interface SandboxClient {
  getStatus(): Promise<SandboxStatus>;
  listScenarios(): Promise<ScenariosResponse>;
  listSessions(): Promise<SessionsResponse>;
  listPartners(): Promise<PartnersResponse>;
  getGamificationState(profileId?: string): Promise<GamificationState>;
  sendGamificationEvent(event: GamificationEvent): Promise<GamificationState>;
}

export function createHttpSandboxClient(
  baseUrl: string,
  fetchFn: typeof fetch = globalThis.fetch,
): SandboxClient {
  const base = baseUrl.replace(/\/$/, "");

  async function get<T>(path: string): Promise<T> {
    const resp = await fetchFn(`${base}${path}`, { method: "GET" });
    if (!resp.ok) {
      throw new Error(`GET ${path} failed: ${resp.status}`);
    }
    return (await resp.json()) as T;
  }

  return {
    getStatus: () => get<SandboxStatus>("/sandbox/status"),
    listScenarios: () => get<ScenariosResponse>("/sandbox/scenarios"),
    listSessions: () => get<SessionsResponse>("/sandbox/sessions"),
    listPartners: () => get<PartnersResponse>("/sandbox/partners"),
    getGamificationState: (profileId?: string) => {
      const q = profileId ? `?profileId=${encodeURIComponent(profileId)}` : "";
      return get<GamificationState>(`/sandbox/gamification/state${q}`);
    },
    async sendGamificationEvent(event: GamificationEvent): Promise<GamificationState> {
      const resp = await fetchFn(`${base}/sandbox/gamification/event`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(event),
      });
      if (!resp.ok) {
        throw new Error(`POST /sandbox/gamification/event failed: ${resp.status}`);
      }
      return (await resp.json()) as GamificationState;
    },
  };
}
