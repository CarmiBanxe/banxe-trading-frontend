import {
  useDecisionSupportStore,
  prefillFromRecommendation,
  isTradable,
} from "@/features/decision-support";
import type { Recommendation } from "@/features/decision-support";

function RiskSnapshot({ rec }: { rec: Recommendation }): JSX.Element {
  const r = rec.riskMetrics;
  return (
    <div data-testid="dse-risk-snapshot">
      <strong>Risk snapshot</strong> — VaR99 {r.var99Pct}% · DD {r.ddPct}% · PnL{" "}
      {r.unrealizedPnlPct}% (${r.unrealizedPnlUsd}) · Δ {r.greeks.delta} Γ {r.greeks.gamma} Θ{" "}
      {r.greeks.theta}
    </div>
  );
}

function EarnSnapshot({ rec }: { rec: Recommendation }): JSX.Element | null {
  const e = rec.earnMetrics;
  if (!e) {
    return null;
  }
  return (
    <div data-testid="dse-earn-snapshot">
      <strong>Earn snapshot</strong> — {e.currentYieldPct}% on {e.protocol} ({e.chain}) · lockup{" "}
      {e.lockupDays}d · {e.variableRate ? "variable" : "fixed"} · {e.riskSummary}
    </div>
  );
}

function RecommendationRow({ rec }: { rec: Recommendation }): JSX.Element {
  return (
    <tr data-testid="dse-rec-row" data-action={rec.action.type}>
      <td>{rec.rank}</td>
      <td>{rec.action.type}</td>
      <td>{rec.action.category}</td>
      <td>{rec.utilityScore}</td>
      <td>{rec.halfKellySizePct}%</td>
      <td>{rec.riskMetrics.var99Pct}%</td>
      <td>{rec.earnMetrics ? `${rec.earnMetrics.currentYieldPct}%` : "—"}</td>
      <td>{rec.reasons}</td>
      <td>
        {isTradable(rec) ? (
          <button
            type="button"
            data-testid="dse-use-btn"
            onClick={() => prefillFromRecommendation(rec)}
          >
            Use this (pre-fill)
          </button>
        ) : (
          "—"
        )}
      </td>
    </tr>
  );
}

export function DecisionSupportWidget(): JSX.Element {
  const status = useDecisionSupportStore((s) => s.status);
  const response = useDecisionSupportStore((s) => s.response);
  const error = useDecisionSupportStore((s) => s.error);

  let body: JSX.Element;
  if (status === "error") {
    body = <div data-testid="dse-error">Advisory unavailable: {error ?? "unknown"}</div>;
  } else if (status === "idle" || status === "loading" || !response) {
    body = <div data-testid="dse-loading">Loading recommendations…</div>;
  } else {
    const top = response.recommendations[0];
    const topEarn = response.recommendations.find((r) => r.earnMetrics);
    body = (
      <>
        {top && <RiskSnapshot rec={top} />}
        {topEarn && <EarnSnapshot rec={topEarn} />}
        <table data-testid="dse-recs">
          <thead>
            <tr>
              <th>#</th>
              <th>Action</th>
              <th>Cat</th>
              <th>Utility</th>
              <th>½-Kelly</th>
              <th>VaR99</th>
              <th>Yield</th>
              <th>Why</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {response.recommendations.map((r) => (
              <RecommendationRow key={r.rank} rec={r} />
            ))}
          </tbody>
        </table>
      </>
    );
  }

  return (
    <div data-testid="dse-widget">
      <h3>Decision Support — Risk &amp; Earn</h3>
      {body}
      {response && <p data-testid="dse-sentiment">Sentiment: {response.sentiment.score}</p>}
      <p data-testid="dse-disclaimer" style={{ fontSize: "0.75rem", opacity: 0.7 }}>
        {response?.disclaimer ??
          "Advisory only — not investment advice. You retain custody and sign all transactions."}{" "}
        Risk &amp; earn figures (Greeks, VaR, PnL, yields) are estimates / simulations, not a
        guarantee of return. &ldquo;Use this&rdquo; only pre-fills the order form — nothing is
        executed automatically.
      </p>
    </div>
  );
}
