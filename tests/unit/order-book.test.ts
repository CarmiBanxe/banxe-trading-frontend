import { describe, it, expect } from "vitest";
import { parseSnapshot, parseDiff, applyDiff } from "../../src/entities/order-book";
import type { RawOrderBookSnapshot, RawOrderBookDiff } from "../../src/entities/order-book";

describe("OrderBook pure functions", () => {
  const rawSnapshot: RawOrderBookSnapshot = {
    bids: [
      { price: "100.5", quantity: "10" },
      { price: "100.0", quantity: "5" },
    ],
    asks: [
      { price: "101.0", quantity: "8" },
      { price: "101.5", quantity: "3" },
    ],
    sequence: 1,
  };

  it("parseSnapshot converts strings to Decimal", () => {
    const snap = parseSnapshot(rawSnapshot);
    expect(snap.bids[0].price.toString()).toBe("100.5");
    expect(snap.bids[0].quantity.toString()).toBe("10");
    expect(snap.sequence).toBe(1);
  });

  it("applyDiff updates existing level", () => {
    const snap = parseSnapshot(rawSnapshot);
    const rawDiff: RawOrderBookDiff = {
      bids: [{ price: "100.5", quantity: "15" }],
      asks: [],
      sequence: 2,
    };
    const diff = parseDiff(rawDiff);
    const updated = applyDiff(snap, diff);

    expect(updated.sequence).toBe(2);
    const bid100_5 = updated.bids.find((b) => b.price.eq("100.5"));
    expect(bid100_5?.quantity.toString()).toBe("15");
  });

  it("applyDiff removes level when quantity is zero", () => {
    const snap = parseSnapshot(rawSnapshot);
    const rawDiff: RawOrderBookDiff = {
      bids: [{ price: "100.0", quantity: "0" }],
      asks: [],
      sequence: 3,
    };
    const diff = parseDiff(rawDiff);
    const updated = applyDiff(snap, diff);

    expect(updated.bids).toHaveLength(1);
    expect(updated.bids[0].price.eq("100.5")).toBe(true);
  });

  it("applyDiff adds new level", () => {
    const snap = parseSnapshot(rawSnapshot);
    const rawDiff: RawOrderBookDiff = {
      bids: [{ price: "99.0", quantity: "20" }],
      asks: [],
      sequence: 4,
    };
    const diff = parseDiff(rawDiff);
    const updated = applyDiff(snap, diff);

    expect(updated.bids).toHaveLength(3);
    // bids sorted desc
    expect(updated.bids[0].price.eq("100.5")).toBe(true);
    expect(updated.bids[2].price.eq("99.0")).toBe(true);
  });

  it("asks sorted ascending", () => {
    const snap = parseSnapshot(rawSnapshot);
    const rawDiff: RawOrderBookDiff = {
      bids: [],
      asks: [{ price: "100.8", quantity: "2" }],
      sequence: 5,
    };
    const diff = parseDiff(rawDiff);
    const updated = applyDiff(snap, diff);

    expect(updated.asks[0].price.eq("100.8")).toBe(true);
    expect(updated.asks[1].price.eq("101.0")).toBe(true);
  });
});
