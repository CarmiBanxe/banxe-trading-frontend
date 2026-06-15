/**
 * BANXE Sandbox Portal (SBOX-6) — INTERNAL UX shell over /api/v1/sandbox/*.
 *
 * A single internal screen for operators / partner-success / compliance that ties
 * together sandbox status (SBOX-1), demo scenarios (SBOX-2), sessions & replay
 * (SBOX-3), the partner pack (SBOX-4), and educational gamification (SBOX-5), with a
 * persistent "Sandbox / No live execution" banner. Read-only over the sandbox API;
 * it never calls /v1/orders* or any live endpoint. Defaults to the mock client.
 */

import { useEffect, useState } from "react";
import {
  buildSandboxClient,
  type GamificationState,
  type PartnerProfile,
  type SandboxClient,
  type SandboxStatus,
  type ScenarioSummary,
  type SessionSummary,
} from "@/features/sandbox-portal";

interface PortalData {
  readonly status: SandboxStatus;
  readonly scenarios: readonly ScenarioSummary[];
  readonly sessions: readonly SessionSummary[];
  readonly partners: readonly PartnerProfile[];
  readonly gamification: GamificationState;
}

async function loadAll(client: SandboxClient): Promise<PortalData> {
  const [status, scenarios, sessions, partners, gamification] = await Promise.all([
    client.getStatus(),
    client.listScenarios(),
    client.listSessions(),
    client.listPartners(),
    client.getGamificationState("demo"),
  ]);
  return {
    status,
    scenarios: scenarios.scenarios,
    sessions: sessions.sessions,
    partners: partners.partners,
    gamification,
  };
}

function Banner(): JSX.Element {
  return (
    <div
      data-testid="sandbox-banner"
      style={{ background: "#fde68a", color: "#713f12", padding: "0.6rem 1rem",
        borderRadius: 6, fontWeight: 600 }}
    >
      Sandbox / Advisory-only / No live execution, billing, KYB, or keys.
    </div>
  );
}

function StatusSection({ status }: { status: SandboxStatus }): JSX.Element {
  return (
    <section data-testid="sandbox-status">
      <h2>Sandbox Overview</h2>
      <p>
        mode: <b>{status.mode}</b> · executionMode: <b>{status.executionMode}</b> · live:{" "}
        <b>{String(status.liveProvidersEnabled)}</b>
      </p>
      <p>advisoryModules: {status.advisoryModules.join(", ")}</p>
      <p style={{ color: "#6b7280" }}>{status.disclaimer}</p>
    </section>
  );
}

function ScenariosSection({ scenarios }: { scenarios: readonly ScenarioSummary[] }): JSX.Element {
  return (
    <section data-testid="sandbox-scenarios">
      <h2>Demo Scenarios</h2>
      <ul>
        {scenarios.map((s) => (
          <li key={s.id}>
            <b>{s.name}</b> — {s.description}{" "}
            <button type="button" title="Open a session (SBOX-3) and replay these steps">
              Start demo run
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SessionsSection({ sessions }: { sessions: readonly SessionSummary[] }): JSX.Element {
  return (
    <section data-testid="sandbox-sessions">
      <h2>Sessions &amp; Replay</h2>
      {sessions.length === 0 ? <p>No demo sessions yet.</p> : null}
      <ul>
        {sessions.map((s) => (
          <li key={s.id}>
            <b>{s.title}</b> — {s.steps.length} step(s)
            {s.finishedAt ? " · finished" : " · open"}
          </li>
        ))}
      </ul>
    </section>
  );
}

function PartnersSection({ partners }: { partners: readonly PartnerProfile[] }): JSX.Element {
  return (
    <section data-testid="sandbox-partners">
      <h2>Partner Sandbox</h2>
      <ul>
        {partners.map((p) => (
          <li key={p.id}>
            <b>{p.name}</b> ({p.segment}, {p.region}) — tier {p.sampleRateLimitTier}
          </li>
        ))}
      </ul>
    </section>
  );
}

function GamificationSection({ state }: { state: GamificationState }): JSX.Element {
  return (
    <section data-testid="sandbox-gamification">
      <h2>Educational Gamification</h2>
      <p>
        streak: <b>{state.streak.current}</b> (best {state.streak.best}) · scenarios:{" "}
        {state.completedScenarios.length} · sessions: {state.completedSessions}
      </p>
      <p>badges: {state.badges.map((b) => b.title).join(", ") || "none yet"}</p>
    </section>
  );
}

export function SandboxPortalPage({ client }: { client?: SandboxClient }): JSX.Element {
  const [data, setData] = useState<PortalData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sandbox = client ?? buildSandboxClient();
    let active = true;
    loadAll(sandbox)
      .then((d) => active && setData(d))
      .catch((e: unknown) => active && setError(e instanceof Error ? e.message : "load failed"));
    return () => {
      active = false;
    };
  }, [client]);

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "1rem", fontFamily: "system-ui" }}>
      <h1>BANXE Sandbox Portal</h1>
      <Banner />
      {error ? <p data-testid="sandbox-error" style={{ color: "#b91c1c" }}>{error}</p> : null}
      {data === null && error === null ? <p data-testid="sandbox-loading">Loading…</p> : null}
      {data !== null ? (
        <>
          <StatusSection status={data.status} />
          <ScenariosSection scenarios={data.scenarios} />
          <SessionsSection sessions={data.sessions} />
          <PartnersSection partners={data.partners} />
          <GamificationSection state={data.gamification} />
        </>
      ) : null}
    </div>
  );
}
