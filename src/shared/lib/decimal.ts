/**
 * Decimal placeholder (I-01: no float for money).
 *
 * All order math, price calculations, and monetary values MUST use
 * a proper decimal library (e.g. decimal.js or big.js).
 * Implementation deferred to §2.4 (IL-154 reuse extraction).
 *
 * DO NOT use native JS number/float for any monetary arithmetic.
 */

export type MonetaryAmount = string; // placeholder — use decimal lib in §2.4
