import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OrderBookPage } from "../../src/pages/order-book/OrderBookPage";
import { useOrderBookStore } from "../../src/entities/order-book";
import { useFeedStatusStore } from "../../src/features/order-book-feed";

describe("OrderBookPage with mock feed", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useOrderBookStore.getState().reset();
    useFeedStatusStore.getState().setStatus("closed");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders, opens the mock feed, and shows live order-book rows", () => {
    render(<OrderBookPage />);

    // Before the deferred open fires, the widget is in its loading state.
    expect(screen.getByText("Trading")).toBeInTheDocument();
    expect(screen.getByTestId("ob-loading")).toBeInTheDocument();

    // Drive the mock socket: open + snapshot are delivered on the next tick.
    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(screen.getByTestId("ob-live")).toBeInTheDocument();
    expect(screen.getAllByTestId("bid-row").length).toBeGreaterThan(0);
    expect(screen.getByTestId("ob-conn-status")).toHaveAttribute("data-status", "open");
  });
});
