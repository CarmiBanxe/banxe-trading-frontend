/**
 * Deterministic mock sandbox client — the DEFAULT for dev/CI. No network.
 *
 * Mirrors the backend SBOX-1..5 shapes so the portal renders fully offline.
 */

import type { GamificationEvent, SandboxClient } from "./client";
import type {
  GamificationState,
  PartnersResponse,
  SandboxStatus,
  ScenariosResponse,
  SessionsResponse,
} from "./types";

const STATUS: SandboxStatus = {
  mode: "sandbox-demo",
  advisoryModules: [
    "dss",
    "mm-preview",
    "fees-preview",
    "quant-preview",
    "execution-intent-preview",
    "marketplace",
  ],
  executionMode: "unsigned-preview-only",
  liveProvidersEnabled: false,
  billingEnabled: false,
  kybEnabled: false,
  lineageEnabled: true,
  disclaimer: "Sandbox-only advisory environment. No live trading, billing, or partner activation.",
};

const SCENARIOS: ScenariosResponse = {
  scenarios: [
    { id: "spot-swap-demo", name: "Spot Swap Demo", description: "Spot swap walkthrough.",
      tags: ["spot", "swap", "advisory"] },
    { id: "perp-hedge-demo", name: "Perp Hedge Demo", description: "Perp hedge walkthrough.",
      tags: ["perp", "hedge", "advisory"] },
    { id: "yield-rebalance-demo", name: "Yield Rebalance Demo", description: "Earn rebalance.",
      tags: ["earn", "yield", "advisory"] },
  ],
};

const SESSIONS: SessionsResponse = {
  sessions: [
    { id: "demo-session-1", startedAt: "2026-06-15T10:00:00Z", finishedAt: null,
      scenarioId: "spot-swap-demo", title: "Spot swap walkthrough", description: "Demo run",
      steps: [], notes: null },
  ],
};

const PARTNERS: PartnersResponse = {
  partners: [
    { id: "sbox-partner-foobank-neo", slug: "foobank-neo", name: "FooBank (neo-bank demo)",
      segment: "neo-bank", region: "EU/EEA", useCase: "Embedded advisory trading sandbox.",
      enabledModules: ["dss", "fees-preview", "quant-preview", "execution-preview", "marketplace",
        "sessions"], sampleRateLimitTier: "sandbox-pro",
      disclaimer: "Sandbox partner profile — demonstration only." },
  ],
};

function gamification(profileId: string | null): GamificationState {
  return {
    profileId,
    completedScenarios: ["spot-swap-demo"],
    completedSessions: 1,
    badges: [
      { id: "first-scenario", title: "First Steps", description: "Completed your first scenario." },
      { id: "session-replay", title: "Replay Watcher", description: "Viewed a session replay." },
    ],
    streak: { current: 2, best: 2 },
  };
}

export function createMockSandboxClient(): SandboxClient {
  return {
    getStatus: () => Promise.resolve(STATUS),
    listScenarios: () => Promise.resolve(SCENARIOS),
    listSessions: () => Promise.resolve(SESSIONS),
    listPartners: () => Promise.resolve(PARTNERS),
    getGamificationState: (profileId?: string) => Promise.resolve(gamification(profileId ?? "demo")),
    sendGamificationEvent: (event: GamificationEvent) =>
      Promise.resolve(gamification(event.profileId ?? "demo")),
  };
}
