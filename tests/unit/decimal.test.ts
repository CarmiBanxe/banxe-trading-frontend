import { describe, it, expect } from "vitest";
import { Decimal } from "../../src/shared/lib/decimal";

describe("Decimal", () => {
  it("adds correctly", () => {
    const a = new Decimal("0.1");
    const b = new Decimal("0.2");
    expect(a.add(b).toString()).toBe("0.3");
  });

  it("subtracts correctly", () => {
    expect(new Decimal("1.5").sub("0.3").toString()).toBe("1.2");
  });

  it("multiplies correctly", () => {
    expect(new Decimal("3").mul("0.7").toString()).toBe("2.1");
  });

  it("divides correctly", () => {
    expect(new Decimal("10").div("3").toFixed(8)).toBe("3.33333333");
  });

  it("compares correctly", () => {
    const a = new Decimal("5");
    const b = new Decimal("3");
    expect(a.gt(b)).toBe(true);
    expect(a.lt(b)).toBe(false);
    expect(a.eq("5")).toBe(true);
  });

  it("handles zero", () => {
    expect(Decimal.ZERO.isZero()).toBe(true);
    expect(new Decimal("0.00").isZero()).toBe(true);
  });

  it("abs and neg", () => {
    const neg = new Decimal("-5.5");
    expect(neg.abs().toString()).toBe("5.5");
    expect(neg.neg().toString()).toBe("5.5");
  });

  it("avoids float precision errors (I-01)", () => {
    // Classic float fail: 0.1 + 0.2 !== 0.3 in JS
    const result = new Decimal("0.1").add("0.2");
    expect(result.eq("0.3")).toBe(true);
  });
});
