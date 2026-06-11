/**
 * Zustand store for order-entry form state.
 * Selectors call existing order-calculators; all math via Decimal (I-01).
 */

import { create } from "zustand";
import { Decimal } from "@/shared/lib/decimal";
import type { Side } from "@/features/order-calculators";
import {
  calculateMarginRequired,
  calculateUnrealizedPnl,
  calculateLiquidationPrice,
} from "@/features/order-calculators";
import { isFormValid } from "./validation";

export interface OrderEntryState {
  readonly side: Side;
  readonly entryPrice: string;
  readonly quantity: string;
  readonly leverage: string;
  setSide: (side: Side) => void;
  setEntryPrice: (v: string) => void;
  setQuantity: (v: string) => void;
  setLeverage: (v: string) => void;
  reset: () => void;
}

const DEFAULTS = {
  side: "long" as Side,
  entryPrice: "",
  quantity: "",
  leverage: "10",
};

export const useOrderEntryStore = create<OrderEntryState>((set) => ({
  ...DEFAULTS,
  setSide: (side) => set({ side }),
  setEntryPrice: (entryPrice) => set({ entryPrice }),
  setQuantity: (quantity) => set({ quantity }),
  setLeverage: (leverage) => set({ leverage }),
  reset: () => set(DEFAULTS),
}));

/** Derived computations — call outside React render or in selectors. */
export function computeDerived(state: {
  entryPrice: string;
  quantity: string;
  leverage: string;
  side: Side;
  markPrice: string | null;
}): {
  margin: Decimal | null;
  pnl: Decimal | null;
  liquidation: Decimal | null;
} {
  if (!isFormValid(state.entryPrice, state.quantity, state.leverage)) {
    return { margin: null, pnl: null, liquidation: null };
  }

  const entry = new Decimal(state.entryPrice);
  const qty = new Decimal(state.quantity);
  const lev = new Decimal(state.leverage);

  const margin = calculateMarginRequired(entry, qty, lev);
  const liquidation = calculateLiquidationPrice(entry, lev, state.side);

  let pnl: Decimal | null = null;
  if (state.markPrice) {
    pnl = calculateUnrealizedPnl(entry, new Decimal(state.markPrice), qty, state.side);
  }

  return { margin, pnl, liquidation };
}
