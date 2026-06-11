import { describe, it, expect } from "vitest";
import { Decimal } from "../../src/shared/lib/decimal";
import {
  calculateUnrealizedPnl,
  calculateMarginRequired,
  calculateLiquidationPrice,
} from "../../src/features/order-calculators";

describe("Order calculators", () => {
  describe("calculateUnrealizedPnl", () => {
    it("long position with profit", () => {
      const pnl = calculateUnrealizedPnl(
        new Decimal("100"),
        new Decimal("110"),
        new Decimal("5"),
        "long",
      );
      // (110 - 100) * 5 = 50
      expect(pnl.eq("50")).toBe(true);
    });

    it("long position with loss", () => {
      const pnl = calculateUnrealizedPnl(
        new Decimal("100"),
        new Decimal("90"),
        new Decimal("5"),
        "long",
      );
      // (90 - 100) * 5 = -50
      expect(pnl.eq("-50")).toBe(true);
    });

    it("short position with profit", () => {
      const pnl = calculateUnrealizedPnl(
        new Decimal("100"),
        new Decimal("90"),
        new Decimal("5"),
        "short",
      );
      // (100 - 90) * 5 = 50
      expect(pnl.eq("50")).toBe(true);
    });

    it("short position with loss", () => {
      const pnl = calculateUnrealizedPnl(
        new Decimal("100"),
        new Decimal("110"),
        new Decimal("5"),
        "short",
      );
      // (100 - 110) * 5 = -50
      expect(pnl.eq("-50")).toBe(true);
    });

    it("uses Decimal precision (no float drift)", () => {
      const pnl = calculateUnrealizedPnl(
        new Decimal("0.1"),
        new Decimal("0.3"),
        new Decimal("1"),
        "long",
      );
      // (0.3 - 0.1) * 1 = 0.2 exactly
      expect(pnl.eq("0.2")).toBe(true);
    });
  });

  describe("calculateMarginRequired", () => {
    it("basic margin calculation", () => {
      const margin = calculateMarginRequired(
        new Decimal("50000"),
        new Decimal("0.1"),
        new Decimal("10"),
      );
      // (50000 * 0.1) / 10 = 500
      expect(margin.eq("500")).toBe(true);
    });
  });

  describe("calculateLiquidationPrice", () => {
    it("long liquidation below entry", () => {
      const liq = calculateLiquidationPrice(
        new Decimal("10000"),
        new Decimal("10"),
        "long",
      );
      // 10000 * (1 - 1/10) = 10000 * 0.9 = 9000
      expect(liq.eq("9000")).toBe(true);
    });

    it("short liquidation above entry", () => {
      const liq = calculateLiquidationPrice(
        new Decimal("10000"),
        new Decimal("10"),
        "short",
      );
      // 10000 * (1 + 1/10) = 10000 * 1.1 = 11000
      expect(liq.eq("11000")).toBe(true);
    });
  });
});
