import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useOrderBookStore } from "../../src/entities/order-book/store";
import { OrderBookWidget } from "../../src/widgets/order-book/OrderBookWidget";
import type { RawOrderBookSnapshot } from "../../src/entities/order-book";

const SNAPSHOT: RawOrderBookSnapshot = {
  bids: [
    { price: "67250.50", quantity: "1.2500" },
    { price: "67249.00", quantity: "0.8000" },
  ],
  asks: [
    { price: "67251.00", quantity: "0.9000" },
    { price: "67252.50", quantity: "1.5000" },
  ],
  sequence: 1,
};

describe("OrderBookWidget", () => {
  beforeEach(() => {
    useOrderBookStore.getState().reset();
  });

  it("shows loading when idle", () => {
    render(<OrderBookWidget />);
    expect(screen.getByTestId("ob-loading")).toBeInTheDocument();
  });

  it("shows loading when status is loading", () => {
    useOrderBookStore.getState().setStatus("loading");
    render(<OrderBookWidget />);
    expect(screen.getByTestId("ob-loading")).toBeInTheDocument();
  });

  it("shows error state", () => {
    useOrderBookStore.getState().setStatus("error", "connection failed");
    render(<OrderBookWidget />);
    expect(screen.getByTestId("ob-error")).toHaveTextContent("connection failed");
  });

  it("shows empty state when snapshot has no levels", () => {
    useOrderBookStore.getState().applySnapshot({
      bids: [],
      asks: [],
      sequence: 1,
    });
    render(<OrderBookWidget />);
    expect(screen.getByTestId("ob-empty")).toBeInTheDocument();
  });

  it("renders bid and ask rows with Decimal formatting", () => {
    useOrderBookStore.getState().applySnapshot(SNAPSHOT);
    render(<OrderBookWidget />);

    const live = screen.getByTestId("ob-live");
    expect(live).toBeInTheDocument();

    const bidRows = screen.getAllByTestId("bid-row");
    expect(bidRows).toHaveLength(2);
    expect(bidRows[0]).toHaveTextContent("67250.50");
    expect(bidRows[0]).toHaveTextContent("1.2500");

    const askRows = screen.getAllByTestId("ask-row");
    expect(askRows).toHaveLength(2);
    expect(askRows[0]).toHaveTextContent("67251.00");
    expect(askRows[0]).toHaveTextContent("0.9000");
  });
});
