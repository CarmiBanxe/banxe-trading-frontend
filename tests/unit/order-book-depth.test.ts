import { describe, it, expect } from "vitest";
import { parseSnapshot, cumulativeDepth } from "../../src/entities/order-book";
import type { RawOrderBookSnapshot } from "../../src/entities/order-book";

function depthOf(raw: RawOrderBookSnapshot) {
  return cumulativeDepth(parseSnapshot(raw));
}

describe("cumulativeDepth", () => {
  it("accumulates quantities outward from the best price on each side", () => {
    const { bids, asks } = depthOf({
      bids: [
        { price: "100.00", quantity: "2.0000" },
        { price: "99.00", quantity: "1.0000" },
        { price: "98.00", quantity: "3.0000" },
      ],
      asks: [
        { price: "101.00", quantity: "1.5000" },
        { price: "102.00", quantity: "0.5000" },
      ],
      sequence: 1,
    });

    expect(bids).toEqual([
      { price: 100, cumulative: 2 },
      { price: 99, cumulative: 3 },
      { price: 98, cumulative: 6 },
    ]);
    expect(asks).toEqual([
      { price: 101, cumulative: 1.5 },
      { price: 102, cumulative: 2 },
    ]);
  });

  it("returns empty series for an empty book", () => {
    expect(depthOf({ bids: [], asks: [], sequence: 0 })).toEqual({
      bids: [],
      asks: [],
    });
  });

  it("handles a single level per side", () => {
    const { bids, asks } = depthOf({
      bids: [{ price: "50.00", quantity: "4.0000" }],
      asks: [{ price: "51.00", quantity: "7.0000" }],
      sequence: 1,
    });
    expect(bids).toEqual([{ price: 50, cumulative: 4 }]);
    expect(asks).toEqual([{ price: 51, cumulative: 7 }]);
  });

  it("computes each side independently even for a crossed book", () => {
    const { bids, asks } = depthOf({
      bids: [{ price: "101.00", quantity: "1.0000" }],
      asks: [{ price: "100.00", quantity: "2.0000" }],
      sequence: 1,
    });
    expect(bids).toEqual([{ price: 101, cumulative: 1 }]);
    expect(asks).toEqual([{ price: 100, cumulative: 2 }]);
  });

  it("accumulates with Decimal precision (I-01, no float drift)", () => {
    const { bids } = depthOf({
      bids: [
        { price: "10.00", quantity: "0.1" },
        { price: "9.00", quantity: "0.2" },
      ],
      asks: [],
      sequence: 1,
    });
    // 0.1 + 0.2 === 0.3 exactly, not 0.30000000000000004
    expect(bids[1].cumulative).toBe(0.3);
  });
});
