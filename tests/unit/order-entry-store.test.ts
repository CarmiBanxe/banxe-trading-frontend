import { describe, it, expect, beforeEach } from "vitest";
import { useOrderEntryStore, computeDerived } from "../../src/features/order-entry/store";

describe("OrderEntry store", () => {
  beforeEach(() => {
    useOrderEntryStore.getState().reset();
  });

  it("starts with defaults", () => {
    const s = useOrderEntryStore.getState();
    expect(s.side).toBe("long");
    expect(s.entryPrice).toBe("");
    expect(s.quantity).toBe("");
    expect(s.leverage).toBe("10");
  });

  it("updates fields", () => {
    useOrderEntryStore.getState().setSide("short");
    useOrderEntryStore.getState().setEntryPrice("50000");
    useOrderEntryStore.getState().setQuantity("0.5");
    useOrderEntryStore.getState().setLeverage("20");
    const s = useOrderEntryStore.getState();
    expect(s.side).toBe("short");
    expect(s.entryPrice).toBe("50000");
    expect(s.quantity).toBe("0.5");
    expect(s.leverage).toBe("20");
  });

  it("reset restores defaults", () => {
    useOrderEntryStore.getState().setSide("short");
    useOrderEntryStore.getState().setEntryPrice("999");
    useOrderEntryStore.getState().reset();
    expect(useOrderEntryStore.getState().side).toBe("long");
    expect(useOrderEntryStore.getState().entryPrice).toBe("");
  });
});

describe("computeDerived", () => {
  it("returns nulls when form invalid", () => {
    const r = computeDerived({
      entryPrice: "",
      quantity: "1",
      leverage: "10",
      side: "long",
      markPrice: "100",
    });
    expect(r.margin).toBeNull();
    expect(r.pnl).toBeNull();
    expect(r.liquidation).toBeNull();
  });

  it("computes margin correctly (long)", () => {
    // margin = (50000 * 0.1) / 10 = 500
    const r = computeDerived({
      entryPrice: "50000",
      quantity: "0.1",
      leverage: "10",
      side: "long",
      markPrice: null,
    });
    expect(r.margin!.eq("500")).toBe(true);
    expect(r.pnl).toBeNull();
  });

  it("computes PNL when markPrice provided (long profit)", () => {
    // PNL = (55000 - 50000) * 0.1 = 500
    const r = computeDerived({
      entryPrice: "50000",
      quantity: "0.1",
      leverage: "10",
      side: "long",
      markPrice: "55000",
    });
    expect(r.pnl!.eq("500")).toBe(true);
  });

  it("computes PNL (short profit)", () => {
    // PNL = (50000 - 45000) * 0.1 = 500
    const r = computeDerived({
      entryPrice: "50000",
      quantity: "0.1",
      leverage: "10",
      side: "short",
      markPrice: "45000",
    });
    expect(r.pnl!.eq("500")).toBe(true);
  });

  it("computes liquidation (long)", () => {
    // liq = 50000 * (1 - 1/10) = 45000
    const r = computeDerived({
      entryPrice: "50000",
      quantity: "0.1",
      leverage: "10",
      side: "long",
      markPrice: null,
    });
    expect(r.liquidation!.eq("45000")).toBe(true);
  });

  it("computes liquidation (short)", () => {
    // liq = 50000 * (1 + 1/10) = 55000
    const r = computeDerived({
      entryPrice: "50000",
      quantity: "0.1",
      leverage: "10",
      side: "short",
      markPrice: null,
    });
    expect(r.liquidation!.eq("55000")).toBe(true);
  });

  it("uses Decimal precision (no float drift)", () => {
    // margin = (0.3 * 1) / 1 = 0.3 exactly
    const r = computeDerived({
      entryPrice: "0.3",
      quantity: "1",
      leverage: "1",
      side: "long",
      markPrice: "0.5",
    });
    expect(r.margin!.eq("0.3")).toBe(true);
    // PNL = (0.5 - 0.3) * 1 = 0.2 exactly
    expect(r.pnl!.eq("0.2")).toBe(true);
  });
});
