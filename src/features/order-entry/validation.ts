/**
 * Pure validation for order-entry form fields.
 * All checks are pure functions — no store dependency.
 */

import { Decimal } from "@/shared/lib/decimal";

const MIN_LEVERAGE = new Decimal("1");
const MAX_LEVERAGE = new Decimal("125");

export interface ValidationResult {
  readonly valid: boolean;
  readonly error: string | null;
}

const OK: ValidationResult = { valid: true, error: null };

export function validatePrice(value: string): ValidationResult {
  if (!value.trim()) return { valid: false, error: "Price is required" };
  try {
    const d = new Decimal(value);
    if (d.lte("0")) return { valid: false, error: "Price must be positive" };
    return OK;
  } catch {
    return { valid: false, error: "Invalid number" };
  }
}

export function validateQuantity(value: string): ValidationResult {
  if (!value.trim()) return { valid: false, error: "Quantity is required" };
  try {
    const d = new Decimal(value);
    if (d.lte("0")) return { valid: false, error: "Quantity must be positive" };
    return OK;
  } catch {
    return { valid: false, error: "Invalid number" };
  }
}

export function validateLeverage(value: string): ValidationResult {
  if (!value.trim()) return { valid: false, error: "Leverage is required" };
  try {
    const d = new Decimal(value);
    if (d.lt(MIN_LEVERAGE)) {
      return { valid: false, error: `Leverage min ${MIN_LEVERAGE.toString()}` };
    }
    if (d.gt(MAX_LEVERAGE)) {
      return { valid: false, error: `Leverage max ${MAX_LEVERAGE.toString()}` };
    }
    return OK;
  } catch {
    return { valid: false, error: "Invalid number" };
  }
}

export function isFormValid(
  price: string,
  quantity: string,
  leverage: string,
): boolean {
  return (
    validatePrice(price).valid &&
    validateQuantity(quantity).valid &&
    validateLeverage(leverage).valid
  );
}
