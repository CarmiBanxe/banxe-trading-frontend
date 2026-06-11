import { describe, it, expect, beforeEach } from "vitest";
import { useOrderBookStore } from "../../src/entities/order-book/store";
import type { RawOrderBookSnapshot, RawOrderBookDiff } from "../../src/entities/order-book";

const RAW_SNAPSHOT: RawOrderBookSnapshot = {
  bids: [
    { price: "100.5", quantity: "10" },
    { price: "100.0", quantity: "5" },
    { price: "99.5", quantity: "3" },
  ],
  asks: [
    { price: "101.0", quantity: "8" },
    { price: "101.5", quantity: "3" },
    { price: "102.0", quantity: "1" },
  ],
  sequence: 1,
};

describe("OrderBook Zustand store", () => {
  beforeEach(() => {
    useOrderBookStore.getState().reset();
  });

  it("starts idle with null snapshot", () => {
    const { snapshot, status } = useOrderBookStore.getState();
    expect(snapshot).toBeNull();
    expect(status).toBe("idle");
  });

  it("applies snapshot and sets status to live", () => {
    useOrderBookStore.getState().applySnapshot(RAW_SNAPSHOT);
    const { snapshot, status } = useOrderBookStore.getState();
    expect(status).toBe("live");
    expect(snapshot).not.toBeNull();
    expect(snapshot!.bids).toHaveLength(3);
    expect(snapshot!.asks).toHaveLength(3);
    expect(snapshot!.sequence).toBe(1);
  });

  it("bids sorted descending, asks ascending after snapshot", () => {
    useOrderBookStore.getState().applySnapshot(RAW_SNAPSHOT);
    const { snapshot } = useOrderBookStore.getState();
    expect(snapshot!.bids[0].price.toString()).toBe("100.5");
    expect(snapshot!.bids[2].price.toString()).toBe("99.5");
    expect(snapshot!.asks[0].price.toString()).toBe("101");
    expect(snapshot!.asks[2].price.toString()).toBe("102");
  });

  it("applies diff updating a level", () => {
    useOrderBookStore.getState().applySnapshot(RAW_SNAPSHOT);
    const diff: RawOrderBookDiff = {
      bids: [{ price: "100.5", quantity: "15" }],
      asks: [],
      sequence: 2,
    };
    useOrderBookStore.getState().applyDiff(diff);
    const { snapshot } = useOrderBookStore.getState();
    expect(snapshot!.sequence).toBe(2);
    expect(snapshot!.bids[0].quantity.toString()).toBe("15");
  });

  it("ignores diff with stale sequence", () => {
    useOrderBookStore.getState().applySnapshot(RAW_SNAPSHOT);
    const diff: RawOrderBookDiff = {
      bids: [{ price: "100.5", quantity: "99" }],
      asks: [],
      sequence: 0,
    };
    useOrderBookStore.getState().applyDiff(diff);
    const { snapshot } = useOrderBookStore.getState();
    expect(snapshot!.sequence).toBe(1);
    expect(snapshot!.bids[0].quantity.toString()).toBe("10");
  });

  it("ignores diff when no snapshot loaded", () => {
    const diff: RawOrderBookDiff = {
      bids: [{ price: "100", quantity: "5" }],
      asks: [],
      sequence: 1,
    };
    useOrderBookStore.getState().applyDiff(diff);
    expect(useOrderBookStore.getState().snapshot).toBeNull();
  });

  it("trims to topN levels", () => {
    const bigSnapshot: RawOrderBookSnapshot = {
      bids: Array.from({ length: 20 }, (_, i) => ({
        price: String(100 - i),
        quantity: "1",
      })),
      asks: Array.from({ length: 20 }, (_, i) => ({
        price: String(101 + i),
        quantity: "1",
      })),
      sequence: 1,
    };
    useOrderBookStore.getState().applySnapshot(bigSnapshot);
    const { snapshot } = useOrderBookStore.getState();
    expect(snapshot!.bids).toHaveLength(10);
    expect(snapshot!.asks).toHaveLength(10);
  });

  it("reset clears state", () => {
    useOrderBookStore.getState().applySnapshot(RAW_SNAPSHOT);
    useOrderBookStore.getState().reset();
    const { snapshot, status } = useOrderBookStore.getState();
    expect(snapshot).toBeNull();
    expect(status).toBe("idle");
  });
});
