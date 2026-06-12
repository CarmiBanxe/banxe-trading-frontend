/**
 * Env-driven WalletAuthController factory.
 *
 * Default `VITE_WALLET_PROVIDER` = "mock" → deterministic, no real wallet/network
 * (dev/CI). "injected" uses MetaMask (`window.ethereum`). "walletconnect" is
 * OPERATOR-GATED (needs `VITE_WALLETCONNECT_PROJECT_ID`) and intentionally unwired.
 */

import { createHttpAuthClient } from "./auth-client";
import { selectSigner } from "./connector";
import type { WalletProviderKind } from "./connector";
import { WalletAuthController } from "./controller";

export function buildWalletAuthController(): WalletAuthController {
  const apiUrl = import.meta.env.VITE_AUTH_API_URL ?? "/api/v1";
  const provider = (import.meta.env.VITE_WALLET_PROVIDER ?? "mock") as WalletProviderKind;
  const host = globalThis.window?.location?.host || "localhost";
  const origin = globalThis.window?.location?.origin || "https://localhost";
  return new WalletAuthController({
    signer: selectSigner(provider),
    authClient: createHttpAuthClient(apiUrl),
    siwe: { domain: host, uri: origin, chainId: 1, statement: "Sign in to Banxe." },
  });
}
