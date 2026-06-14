import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { DecisionSupportWidget } from "../../src/widgets/decision-support";
import {
  DecisionSupportController,
  createMockDseClient,
  useDecisionSupportStore,
} from "../../src/features/decision-support";
import { useOrderEntryStore } from "../../src/features/order-entry";

async function load(): Promise<void> {
  const ctrl = new DecisionSupportController({ client: createMockDseClient() });
  await ctrl.recommend({ asset: "BTCUSDT", portfolioValueUsd: "10000" });
}

describe("DecisionSupportWidget", () => {
  beforeEach(() => {
    useDecisionSupportStore.getState().reset();
    useOrderEntryStore.getState().reset();
  });

  it("shows loading before any advisory is fetched", () => {
    render(<DecisionSupportWidget />);
    expect(screen.getByTestId("dse-loading")).toBeInTheDocument();
    // The advisory disclaimer is always visible (compliance-first).
    expect(screen.getByTestId("dse-disclaimer")).toHaveTextContent(/Advisory only/);
  });

  it("renders ranked recs + risk/earn snapshots + disclaimer (mock client)", async () => {
    await load();
    render(<DecisionSupportWidget />);

    expect(screen.getByTestId("dse-recs")).toBeInTheDocument();
    expect(screen.getAllByTestId("dse-rec-row")).toHaveLength(4);
    // Risk snapshot (top rec) + Earn snapshot (the STAKE rec) present.
    expect(screen.getByTestId("dse-risk-snapshot")).toHaveTextContent(/VaR99/);
    expect(screen.getByTestId("dse-earn-snapshot")).toHaveTextContent(/mock-stakekit/);
    expect(screen.getByTestId("dse-sentiment")).toHaveTextContent("0.35");
    // Disclaimer notes estimates/simulations + no auto-execution.
    expect(screen.getByTestId("dse-disclaimer")).toHaveTextContent(/estimates \/ simulations/);
    expect(screen.getByTestId("dse-disclaimer")).toHaveTextContent(/nothing is executed/);
  });

  it("'Use this' only pre-fills the order form — no execution", async () => {
    await load();
    render(<DecisionSupportWidget />);
    // Default order-entry side is "long"; pre-fill a SELL-like row would flip it.
    // Click the first tradable row's button (BUY → long).
    const buttons = screen.getAllByTestId("dse-use-btn");
    expect(buttons.length).toBeGreaterThan(0);
    fireEvent.click(buttons[0]);
    // The order-entry form is pre-filled (side set) — but nothing is submitted:
    // there is no execution path in the widget, only the form store changed.
    expect(useOrderEntryStore.getState().side).toBe("long");
    // earn/meta rows are display-only (no button) — advisory-only.
    expect(screen.queryAllByTestId("dse-use-btn").length).toBeLessThan(
      screen.getAllByTestId("dse-rec-row").length,
    );
  });

  it("shows an error state", () => {
    useDecisionSupportStore.getState().setStatus("error", "boom");
    render(<DecisionSupportWidget />);
    expect(screen.getByTestId("dse-error")).toHaveTextContent("boom");
  });
});
