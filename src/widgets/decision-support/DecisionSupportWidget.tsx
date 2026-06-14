import { useDecisionSupportStore } from "@/features/decision-support";
import type { Recommendation } from "@/features/decision-support";

function RecommendationRow({ rec }: { rec: Recommendation }): JSX.Element {
  return (
    <tr data-testid="dse-rec-row" data-action={rec.action.type}>
      <td>{rec.rank}</td>
      <td>{rec.action.type}</td>
      <td>{rec.action.category}</td>
      <td>{rec.utilityScore}</td>
      <td>{rec.halfKellySizePct}%</td>
      <td>{rec.reasons}</td>
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
    body = (
      <table data-testid="dse-recs">
        <thead>
          <tr>
            <th>#</th>
            <th>Action</th>
            <th>Cat</th>
            <th>Utility</th>
            <th>½-Kelly</th>
            <th>Why</th>
          </tr>
        </thead>
        <tbody>
          {response.recommendations.map((r) => (
            <RecommendationRow key={r.rank} rec={r} />
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div data-testid="dse-widget">
      <h3>Decision Support</h3>
      {body}
      {response && (
        <p data-testid="dse-sentiment">Sentiment: {response.sentiment.score}</p>
      )}
      <p data-testid="dse-disclaimer" style={{ fontSize: "0.75rem", opacity: 0.7 }}>
        {response?.disclaimer ??
          "Advisory only — not investment advice. You retain custody and sign all transactions."}
      </p>
    </div>
  );
}
