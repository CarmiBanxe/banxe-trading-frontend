import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { DecisionSupportWidget } from "../../src/widgets/decision-support";
import {
  DecisionSupportController,
  createMockDseClient,
  useDecisionSupportStore,
} from "../../src/features/decision-support";

describe("DecisionSupportWidget", () => {
  beforeEach(() => {
    useDecisionSupportStore.getState().reset();
  });

  it("shows loading before any advisory is fetched", () => {
    render(<DecisionSupportWidget />);
    expect(screen.getByTestId("dse-loading")).toBeInTheDocument();
    // The advisory disclaimer is always visible (compliance-first).
    expect(screen.getByTestId("dse-disclaimer")).toHaveTextContent(/Advisory only/);
  });

  it("renders ranked recommendations + disclaimer once loaded (mock client)", async () => {
    const ctrl = new DecisionSupportController({ client: createMockDseClient() });
    await ctrl.recommend({ asset: "BTCUSDT", portfolioValueUsd: "10000" });

    render(<DecisionSupportWidget />);
    expect(screen.getByTestId("dse-recs")).toBeInTheDocument();
    const rows = screen.getAllByTestId("dse-rec-row");
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent("HOLD");
    expect(screen.getByTestId("dse-sentiment")).toHaveTextContent("0.35");
    expect(screen.getByTestId("dse-disclaimer")).toHaveTextContent(/MiCA \/ MiFID II/);
  });

  it("shows an error state", () => {
    useDecisionSupportStore.getState().setStatus("error", "boom");
    render(<DecisionSupportWidget />);
    expect(screen.getByTestId("dse-error")).toHaveTextContent("boom");
  });
});
