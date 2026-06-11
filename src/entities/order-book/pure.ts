/**
 * Pure functions for order-book snapshot + diff application.
 * No live socket — adapted from IL-154 OrderBookStream as deterministic logic.
 */

import { Decimal } from "@/shared/lib/decimal";
import type {
  PriceLevel,
  OrderBookSnapshot,
  OrderBookDiff,
  RawPriceLevel,
  RawOrderBookSnapshot,
  RawOrderBookDiff,
} from "./types";

export function parsePriceLevel(raw: RawPriceLevel): PriceLevel {
  return {
    price: new Decimal(raw.price),
    quantity: new Decimal(raw.quantity),
  };
}

export function parseSnapshot(raw: RawOrderBookSnapshot): OrderBookSnapshot {
  return {
    bids: raw.bids.map(parsePriceLevel),
    asks: raw.asks.map(parsePriceLevel),
    sequence: raw.sequence,
  };
}

export function parseDiff(raw: RawOrderBookDiff): OrderBookDiff {
  return {
    bids: raw.bids.map(parsePriceLevel),
    asks: raw.asks.map(parsePriceLevel),
    sequence: raw.sequence,
  };
}

/** Apply a diff to a snapshot, returning a new snapshot (immutable). */
export function applyDiff(
  snapshot: OrderBookSnapshot,
  diff: OrderBookDiff,
): OrderBookSnapshot {
  return {
    bids: mergeSide(snapshot.bids, diff.bids, "desc"),
    asks: mergeSide(snapshot.asks, diff.asks, "asc"),
    sequence: diff.sequence,
  };
}

function mergeSide(
  existing: readonly PriceLevel[],
  updates: readonly PriceLevel[],
  sort: "asc" | "desc",
): PriceLevel[] {
  const map = new Map<string, PriceLevel>();
  for (const level of existing) {
    map.set(level.price.toString(), level);
  }
  for (const level of updates) {
    if (level.quantity.isZero()) {
      map.delete(level.price.toString());
    } else {
      map.set(level.price.toString(), level);
    }
  }
  const result = Array.from(map.values());
  result.sort((a, b) => {
    if (a.price.lt(b.price)) return sort === "asc" ? -1 : 1;
    if (a.price.gt(b.price)) return sort === "asc" ? 1 : -1;
    return 0;
  });
  return result;
}
