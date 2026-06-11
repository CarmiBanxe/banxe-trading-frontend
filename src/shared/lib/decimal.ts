/**
 * Decimal wrapper (I-01: no float for money).
 *
 * All money, PNL, margin, and price calculations route through this module.
 * Backed by decimal.js for arbitrary-precision arithmetic.
 */

import { Decimal as DecimalJS } from "decimal.js";

export class Decimal {
  private readonly value: DecimalJS;

  constructor(value: string | number | Decimal) {
    if (value instanceof Decimal) {
      this.value = value.value;
    } else {
      this.value = new DecimalJS(value);
    }
  }

  add(other: Decimal | string): Decimal {
    return Decimal.wrap(this.value.plus(Decimal.unwrap(other)));
  }

  sub(other: Decimal | string): Decimal {
    return Decimal.wrap(this.value.minus(Decimal.unwrap(other)));
  }

  mul(other: Decimal | string): Decimal {
    return Decimal.wrap(this.value.times(Decimal.unwrap(other)));
  }

  div(other: Decimal | string): Decimal {
    return Decimal.wrap(this.value.dividedBy(Decimal.unwrap(other)));
  }

  abs(): Decimal {
    return Decimal.wrap(this.value.abs());
  }

  neg(): Decimal {
    return Decimal.wrap(this.value.negated());
  }

  gt(other: Decimal | string): boolean {
    return this.value.greaterThan(Decimal.unwrap(other));
  }

  gte(other: Decimal | string): boolean {
    return this.value.greaterThanOrEqualTo(Decimal.unwrap(other));
  }

  lt(other: Decimal | string): boolean {
    return this.value.lessThan(Decimal.unwrap(other));
  }

  lte(other: Decimal | string): boolean {
    return this.value.lessThanOrEqualTo(Decimal.unwrap(other));
  }

  eq(other: Decimal | string): boolean {
    return this.value.equals(Decimal.unwrap(other));
  }

  isZero(): boolean {
    return this.value.isZero();
  }

  toFixed(dp: number): string {
    return this.value.toFixed(dp);
  }

  toString(): string {
    return this.value.toString();
  }

  static ZERO = new Decimal("0");

  private static unwrap(v: Decimal | string): DecimalJS {
    return v instanceof Decimal ? v.value : new DecimalJS(v);
  }

  private static wrap(v: DecimalJS): Decimal {
    const d = Object.create(Decimal.prototype) as Decimal;
    (d as unknown as { value: DecimalJS }).value = v;
    return d;
  }
}
