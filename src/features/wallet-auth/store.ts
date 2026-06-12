/**
 * Wallet-auth store (Zustand) — holds the opaque session **in memory only**.
 *
 * No localStorage/cookie persistence in this scaffold: the session token lives
 * in memory for the tab lifetime. Self-custodial: no private key is ever stored.
 */

import { create } from "zustand";

export type WalletAuthStatus =
  | "disconnected"
  | "connecting"
  | "authenticating"
  | "authenticated"
  | "error";

export interface WalletAuthState {
  readonly status: WalletAuthStatus;
  readonly address: string | null;
  readonly token: string | null; // opaque session token (in-memory only)
  readonly error: string | null;
  setStatus: (status: WalletAuthStatus, error?: string) => void;
  setSession: (address: string, token: string) => void;
  reset: () => void;
}

export const useWalletAuthStore = create<WalletAuthState>((set) => ({
  status: "disconnected",
  address: null,
  token: null,
  error: null,
  setStatus: (status, error) => set({ status, error: error ?? null }),
  setSession: (address, token) =>
    set({ address, token, status: "authenticated", error: null }),
  reset: () => set({ status: "disconnected", address: null, token: null, error: null }),
}));
