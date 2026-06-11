import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useOrderBookStore } from "../../src/entities/order-book/store";
import { useOrderEntryStore } from "../../src/features/order-entry/store";
import { OrderEntryWidget } from "../../src/widgets/order-entry/OrderEntryWidget";
import type { RawOrderBookSnapshot } from "../../src/entities/order-book";

const SNAPSHOT: RawOrderBookSnapshot = {
  bids: [{ price: "67250.50", quantity: "1.2500" }],
  asks: [{ price: "67251.00", quantity: "0.9000" }],
  sequence: 1,
};

describe("OrderEntryWidget", () => {
  beforeEach(() => {
    useOrderBookStore.getState().reset();
    useOrderEntryStore.getState().reset();
  });

  it("shows loading when order-book is idle", () => {
    render(<OrderEntryWidget />);
    expect(screen.getByTestId("oe-loading")).toBeInTheDocument();
  });

  it("shows form when order-book is live", () => {
    useOrderBookStore.getState().applySnapshot(SNAPSHOT);
    render(<OrderEntryWidget />);
    expect(screen.getByTestId("oe-form")).toBeInTheDocument();
  });

  it("shows computed values with valid inputs", () => {
    useOrderBookStore.getState().applySnapshot(SNAPSHOT);
    useOrderEntryStore.getState().setEntryPrice("50000");
    useOrderEntryStore.getState().setQuantity("0.1");
    useOrderEntryStore.getState().setLeverage("10");

    render(<OrderEntryWidget />);

    // margin = (50000 * 0.1) / 10 = 500.00
    expect(screen.getByTestId("oe-margin")).toHaveTextContent("500.00");
    // liquidation (long) = 50000 * 0.9 = 45000.00
    expect(screen.getByTestId("oe-liquidation")).toHaveTextContent("45000.00");
  });

  it("shows dashes for computed values when form is empty", () => {
    useOrderBookStore.getState().applySnapshot(SNAPSHOT);
    render(<OrderEntryWidget />);

    expect(screen.getByTestId("oe-margin")).toHaveTextContent("—");
    expect(screen.getByTestId("oe-pnl")).toHaveTextContent("—");
    expect(screen.getByTestId("oe-liquidation")).toHaveTextContent("—");
  });

  it("renders side selector defaulting to long", () => {
    useOrderBookStore.getState().applySnapshot(SNAPSHOT);
    render(<OrderEntryWidget />);
    const select = screen.getByTestId("oe-side") as HTMLSelectElement;
    expect(select.value).toBe("long");
  });
});
