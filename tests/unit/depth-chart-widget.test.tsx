import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DepthChartWidget } from "../../src/widgets/depth-chart";
import type {
  DepthChartAdapter,
  DepthChartHandle,
} from "../../src/widgets/depth-chart";
import { useOrderBookStore } from "../../src/entities/order-book";
import type { RawOrderBookSnapshot } from "../../src/entities/order-book";

const SNAPSHOT: RawOrderBookSnapshot = {
  bids: [
    { price: "100.00", quantity: "2.0000" },
    { price: "99.00", quantity: "1.0000" },
  ],
  asks: [{ price: "101.00", quantity: "1.5000" }],
  sequence: 1,
};

function mockAdapter(): { adapter: DepthChartAdapter; handle: DepthChartHandle } {
  const handle: DepthChartHandle = { setDepth: vi.fn(), destroy: vi.fn() };
  const adapter: DepthChartAdapter = { create: vi.fn(() => handle) };
  return { adapter, handle };
}

describe("DepthChartWidget", () => {
  beforeEach(() => {
    useOrderBookStore.getState().reset();
  });

  it("creates the chart via the injected adapter on mount", () => {
    const { adapter } = mockAdapter();
    render(<DepthChartWidget adapter={adapter} />);
    expect(adapter.create).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("depth-chart")).toBeInTheDocument();
  });

  it("shows loading state while idle and does not push data", () => {
    const { adapter, handle } = mockAdapter();
    render(<DepthChartWidget adapter={adapter} />);
    expect(screen.getByTestId("depth-loading")).toBeInTheDocument();
    expect(handle.setDepth).not.toHaveBeenCalled();
  });

  it("shows empty state when the book has no levels", () => {
    useOrderBookStore.getState().applySnapshot({ bids: [], asks: [], sequence: 1 });
    const { adapter } = mockAdapter();
    render(<DepthChartWidget adapter={adapter} />);
    expect(screen.getByTestId("depth-empty")).toBeInTheDocument();
  });

  it("pushes cumulative depth to the chart handle when live", () => {
    useOrderBookStore.getState().applySnapshot(SNAPSHOT);
    const { adapter, handle } = mockAdapter();
    render(<DepthChartWidget adapter={adapter} />);

    expect(screen.queryByTestId("depth-loading")).not.toBeInTheDocument();
    expect(handle.setDepth).toHaveBeenCalledWith(
      [
        { price: 100, cumulative: 2 },
        { price: 99, cumulative: 3 },
      ],
      [{ price: 101, cumulative: 1.5 }],
    );
  });

  it("destroys the chart on unmount", () => {
    const { adapter, handle } = mockAdapter();
    const { unmount } = render(<DepthChartWidget adapter={adapter} />);
    unmount();
    expect(handle.destroy).toHaveBeenCalledTimes(1);
  });
});
