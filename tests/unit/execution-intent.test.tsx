import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { ExecutionIntentWidget } from "@/widgets/execution-intent";
import {
  ExecutionIntentController,
  createMockExecutionIntentClient,
  useExecutionIntentStore,
  buildMockPreview,
  fromRecommendation,
  isTradableAction,
  splitAsset,
} from "@/features/execution-intent";
import { useDecisionSupportStore } from "@/features/decision-support";
import type { RecommendResponse } from "@/features/decision-support";

function ctrl(): ExecutionIntentController {
  return new ExecutionIntentController({ client: createMockExecutionIntentClient() });
}

describe("execution-intent mapping (mirrors backend)", () => {
  it("maps tradable actions to an unsigned order, never signed/submitted", () => {
    const p = buildMockPreview({ asset: "BTCUSDT", actionType: "OPEN_LONG", notionalUsd: "10000" });
    expect(p.tradable).toBe(true);
    expect(p.mode).toBe("sandbox-mock");
    expect(p.signed).toBe(false);
    expect(p.submitted).toBe(false);
    expect(p.order?.side).toBe("buy");
    expect(p.order?.baseAsset).toBe("BTC");
    expect(p.order?.quoteAsset).toBe("USDT");
  });

  it("CLOSE is reduce-only sell; side override respected", () => {
    expect(buildMockPreview({ asset: "ETHUSDT", actionType: "CLOSE", notionalUsd: "1" }).order?.reduceOnly).toBe(
      true,
    );
    const ov = buildMockPreview({ asset: "ETHUSDT", actionType: "CLOSE", notionalUsd: "1", side: "buy" });
    expect(ov.order?.side).toBe("buy");
  });

  it("advisory-only actions are not tradable (no intent)", () => {
    for (const a of ["STAKE", "HEDGE", "HOLD", "WAIT", "REBALANCE", "ADJUST_SL", "SWAP"] as const) {
      const p = buildMockPreview({ asset: "BTCUSDT", actionType: a, notionalUsd: "100" });
      expect(p.tradable).toBe(false);
      expect(p.order).toBeUndefined();
      expect(isTradableAction(a)).toBe(false);
    }
  });

  it("throws on non-positive notional and unsplittable asset", () => {
    expect(() => buildMockPreview({ asset: "BTCUSDT", actionType: "BUY", notionalUsd: "0" })).toThrow();
    expect(() => splitAsset("BTC")).toThrow();
  });

  it("fromRecommendation maps an advisory action to a preview request", () => {
    const req = fromRecommendation(
      { action: { type: "OPEN_LONG", category: "perp", asset: "ETHUSDT" } } as never,
      "5000",
    );
    expect(req).toEqual({ asset: "ETHUSDT", actionType: "OPEN_LONG", notionalUsd: "5000" });
  });
});

describe("ExecutionIntentWidget", () => {
  beforeEach(() => {
    useExecutionIntentStore.getState().reset();
    useDecisionSupportStore.getState().reset();
  });

  it("shows empty state and the PREVIEW-ONLY banner has no Execute button", () => {
    render(<ExecutionIntentWidget controller={ctrl()} />);
    expect(screen.getByTestId("exec-empty")).toBeInTheDocument();
    // Hard invariant: no execute/submit affordance anywhere in the widget.
    expect(screen.queryByText(/execute/i)).toBeNull();
    expect(screen.queryByText(/submit/i)).toBeNull();
  });

  it("previews a manual action and renders the unsigned order (NOT EXECUTED)", async () => {
    render(<ExecutionIntentWidget controller={ctrl()} />);
    fireEvent.click(screen.getByTestId("exec-preview-btn"));
    await screen.findByTestId("exec-preview");
    expect(screen.getByTestId("exec-preview-banner")).toHaveTextContent(/PREVIEW ONLY — NOT EXECUTED/);
    expect(screen.getByTestId("exec-side")).toHaveTextContent("buy"); // default OPEN_LONG
    expect(screen.getByTestId("exec-intent-state")).toHaveTextContent("signed:false");
    expect(screen.getByTestId("exec-intent-state")).toHaveTextContent("submitted:false");
    expect(screen.getByTestId("exec-disclaimer")).toHaveTextContent(/UNSIGNED intent only/);
  });

  it("non-tradable action shows the advisory-only reason, no order", async () => {
    render(<ExecutionIntentWidget controller={ctrl()} />);
    fireEvent.change(screen.getByTestId("exec-action"), { target: { value: "HOLD" } });
    fireEvent.click(screen.getByTestId("exec-preview-btn"));
    await screen.findByTestId("exec-not-tradable");
    expect(screen.queryByTestId("exec-order")).toBeNull();
  });

  it("'From top recommendation' is disabled until a recommendation exists", async () => {
    render(<ExecutionIntentWidget controller={ctrl()} />);
    expect(screen.getByTestId("exec-from-rec-btn")).toBeDisabled();
    // Seed a DSE recommendation; the widget re-renders via its store subscription.
    const resp = {
      recommendations: [{ rank: 1, action: { type: "OPEN_SHORT", category: "perp", asset: "ETHUSDT" } }],
      disclaimer: "x",
    } as unknown as RecommendResponse;
    useDecisionSupportStore.getState().setResponse(resp);
    const btn = await screen.findByTestId("exec-from-rec-btn");
    expect(btn).not.toBeDisabled();
    fireEvent.click(btn);
    await screen.findByTestId("exec-preview");
    expect(screen.getByTestId("exec-side")).toHaveTextContent("sell"); // OPEN_SHORT → sell
  });
});
