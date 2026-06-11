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
