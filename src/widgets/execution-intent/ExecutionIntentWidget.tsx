/**
 * Execution Intent Preview widget (T9.2) — INTERNAL TERMINAL, sandbox/mock-only.
 *
 * The visual bridge between a DSE decision and a potential order: take a chosen
 * recommendation OR a manual action (asset + actionType + notionalUsd) and request
 * the UNSIGNED intent preview. It renders the mapped order + unsigned-intent
 * summary with a clear PREVIEW ONLY / NOT EXECUTED banner. There is NO
 * Execute/Submit button and NO call to any execution endpoint — nothing is signed
 * or sent (self-custodial).
 */

import { useState } from "react";
import { useDecisionSupportStore } from "@/features/decision-support";
import type { ActionType } from "@/features/decision-support";
import {
  buildExecutionIntentController,
  fromRecommendation,
  useExecutionIntentStore,
} from "@/features/execution-intent";
import type { ExecutionIntentController, IntentPreviewResponse } from "@/features/execution-intent";

const ACTIONS: ActionType[] = [
  "BUY",
  "SELL",
  "OPEN_LONG",
  "OPEN_SHORT",
  "CLOSE",
  "STAKE",
  "HOLD",
];

function PreviewView({ p }: { p: IntentPreviewResponse }): JSX.Element {
  return (
    <div data-testid="exec-preview">
      <div data-testid="exec-preview-banner" className="exec-banner">
        ⚠ PREVIEW ONLY — NOT EXECUTED (unsigned · not submitted · mock/sandbox)
      </div>
      {p.tradable && p.order ? (
        <table data-testid="exec-order">
          <tbody>
            <tr><td>Venue</td><td>{p.venue}</td></tr>
            <tr><td>Side</td><td data-testid="exec-side">{p.order.side}</td></tr>
            <tr><td>Order type</td><td>{p.order.type}</td></tr>
            <tr>
              <td>Size</td>
              <td data-testid="exec-amount">
                {p.order.amount} {p.order.baseAsset} / {p.order.quoteAsset}
              </td>
            </tr>
            <tr><td>Reduce-only</td><td>{p.order.reduceOnly ? "yes" : "no"}</td></tr>
            <tr>
              <td>Unsigned intent</td>
              <td data-testid="exec-intent-state">
                {p.intent ? `${p.intent.state} · signed:${p.signed} · submitted:${p.submitted}` : "—"}
              </td>
            </tr>
          </tbody>
        </table>
      ) : (
        <div data-testid="exec-not-tradable">{p.reason}</div>
      )}
      <p data-testid="exec-disclaimer" className="exec-disclaimer">
        {p.disclaimer}
      </p>
    </div>
  );
}

export interface ExecutionIntentWidgetProps {
  readonly controller?: ExecutionIntentController;
}

export function ExecutionIntentWidget({ controller }: ExecutionIntentWidgetProps): JSX.Element {
  const ctrl = controller ?? buildExecutionIntentController();
  const { status, preview, error } = useExecutionIntentStore();
  const topRec = useDecisionSupportStore((s) => s.response?.recommendations[0] ?? null);

  const [asset, setAsset] = useState("BTCUSDT");
  const [action, setAction] = useState<ActionType>("OPEN_LONG");
  const [notional, setNotional] = useState("10000");

  const runManual = (): void => {
    void ctrl.preview({ asset, actionType: action, notionalUsd: notional });
  };
  const runFromRec = (): void => {
    if (topRec) {
      void ctrl.preview(fromRecommendation(topRec, notional));
    }
  };

  return (
    <section data-testid="exec-intent-widget">
      <h3>Execution Intent Preview — internal · sandbox/mock · unsigned</h3>
      <div className="exec-form">
        <label>
          Asset
          <input data-testid="exec-asset" value={asset} onChange={(e) => setAsset(e.target.value)} />
        </label>
        <label>
          Action
          <select
            data-testid="exec-action"
            value={action}
            onChange={(e) => setAction(e.target.value as ActionType)}
          >
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label>
          Notional (USD)
          <input
            data-testid="exec-notional"
            value={notional}
            onChange={(e) => setNotional(e.target.value)}
          />
        </label>
        <button type="button" data-testid="exec-preview-btn" onClick={runManual}>
          Preview unsigned intent
        </button>
        <button
          type="button"
          data-testid="exec-from-rec-btn"
          disabled={topRec === null}
          onClick={runFromRec}
        >
          From top recommendation
        </button>
      </div>
      {status === "error" && <div data-testid="exec-error">{error}</div>}
      {preview ? <PreviewView p={preview} /> : <div data-testid="exec-empty">No preview yet.</div>}
    </section>
  );
}
