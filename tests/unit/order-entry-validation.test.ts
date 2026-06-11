import { describe, it, expect } from "vitest";
import {
  validatePrice,
  validateQuantity,
  validateLeverage,
  isFormValid,
} from "../../src/features/order-entry/validation";

describe("Order entry validation", () => {
  describe("validatePrice", () => {
    it("rejects empty", () => {
      expect(validatePrice("").valid).toBe(false);
      expect(validatePrice("  ").valid).toBe(false);
    });

    it("rejects zero", () => {
      expect(validatePrice("0").valid).toBe(false);
    });

    it("rejects negative", () => {
      expect(validatePrice("-5").valid).toBe(false);
    });

    it("rejects non-numeric", () => {
      expect(validatePrice("abc").valid).toBe(false);
    });

    it("accepts positive decimal", () => {
      expect(validatePrice("67250.50").valid).toBe(true);
    });
  });

  describe("validateQuantity", () => {
    it("rejects zero", () => {
      expect(validateQuantity("0").valid).toBe(false);
    });

    it("accepts positive", () => {
      expect(validateQuantity("0.001").valid).toBe(true);
    });
  });

  describe("validateLeverage", () => {
    it("rejects below 1", () => {
      const r = validateLeverage("0.5");
      expect(r.valid).toBe(false);
      expect(r.error).toContain("min");
    });

    it("rejects above 125", () => {
      const r = validateLeverage("126");
      expect(r.valid).toBe(false);
      expect(r.error).toContain("max");
    });

    it("accepts 1", () => {
      expect(validateLeverage("1").valid).toBe(true);
    });

    it("accepts 125", () => {
      expect(validateLeverage("125").valid).toBe(true);
    });

    it("accepts 10", () => {
      expect(validateLeverage("10").valid).toBe(true);
    });
  });

  describe("isFormValid", () => {
    it("true when all fields valid", () => {
      expect(isFormValid("100", "1", "10")).toBe(true);
    });

    it("false when any field invalid", () => {
      expect(isFormValid("", "1", "10")).toBe(false);
      expect(isFormValid("100", "0", "10")).toBe(false);
      expect(isFormValid("100", "1", "200")).toBe(false);
    });
  });
});
