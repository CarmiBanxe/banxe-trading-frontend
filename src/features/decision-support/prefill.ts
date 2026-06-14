/**
 * Advisory pre-fill — map a recommendation onto the order-entry form ONLY.
 *
 * This NEVER executes, signs, or submits anything (advisory-only, ADR-084). It
 * just pre-populates the existing order-entry form so the user can review and
 * place the order manually. Returns true if the action is tradable (pre-filled),
 * false otherwise (earn/risk/meta actions are display-only here).
 */

import { useOrderEntryStore } from "@/features/order-entry";
import type { Recommendation } from "./types";

const _LONG = new Set<Recommendation["action"]["type"]>(["BUY", "OPEN_LONG"]);
const _SHORT = new Set<Recommendation["action"]["type"]>(["SELL", "OPEN_SHORT"]);

export function isTradable(rec: Recommendation): boolean {
  return _LONG.has(rec.action.type) || _SHORT.has(rec.action.type);
}

export function prefillFromRecommendation(rec: Recommendation): boolean {
  if (!isTradable(rec)) {
    return false;
  }
  // Pre-fill the form side only — no price/qty guess, no execution.
  useOrderEntryStore.getState().setSide(_SHORT.has(rec.action.type) ? "short" : "long");
  return true;
}
