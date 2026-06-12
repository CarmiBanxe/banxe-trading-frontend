import { Decimal } from "@/shared/lib/decimal";

/** Single price level in the order book. */
export interface PriceLevel {
  readonly price: Decimal;
  readonly quantity: Decimal;
}

/** Full order-book snapshot at a point in time. */
export interface OrderBookSnapshot {
  readonly bids: readonly PriceLevel[];
  readonly asks: readonly PriceLevel[];
  readonly sequence: number;
}

/**
 * One point of a cumulative-depth curve. Plain numbers: this is the chart
 * boundary, so Decimal (I-01) is converted to number only here.
 */
export interface DepthPoint {
  readonly price: number;
  readonly cumulative: number;
}

/** Cumulative depth for both sides of the book. */
export interface DepthSeries {
  readonly bids: readonly DepthPoint[];
  readonly asks: readonly DepthPoint[];
}

/** Incremental diff received from the stream. */
export interface OrderBookDiff {
  readonly bids: readonly PriceLevel[];
  readonly asks: readonly PriceLevel[];
  readonly sequence: number;
}

/** Raw wire format before Decimal conversion. */
export interface RawPriceLevel {
  readonly price: string;
  readonly quantity: string;
}

export interface RawOrderBookSnapshot {
  readonly bids: readonly RawPriceLevel[];
  readonly asks: readonly RawPriceLevel[];
  readonly sequence: number;
}

export interface RawOrderBookDiff {
  readonly bids: readonly RawPriceLevel[];
  readonly asks: readonly RawPriceLevel[];
  readonly sequence: number;
}
