/**
 * WalletAuthController — drives the SIWE round-trip.
 *
 *   connect wallet → GET /auth/nonce → build SIWE → sign → POST /auth/verify
 *   → store opaque session (in memory).
 *
 * Signer + auth client are injected, so CI runs a mock signer against a mocked
 * backend with no real wallet and no network. The session sink defaults to the
 * Zustand wallet-auth store.
 */

import { buildSiweMessage } from "./siwe";
import type { AuthClient, SessionResponse } from "./auth-client";
import type { WalletSigner } from "./connector";
import { useWalletAuthStore } from "./store";
import type { WalletAuthStatus } from "./store";

export interface WalletAuthSink {
  setStatus: (status: WalletAuthStatus, error?: string) => void;
  setSession: (address: string, token: string) => void;
  reset: () => void;
}

export interface SiweConfig {
  readonly domain: string;
  readonly uri: string;
  readonly chainId: number;
  readonly statement?: string;
}

export interface WalletAuthOptions {
  readonly signer: WalletSigner;
  readonly authClient: AuthClient;
  readonly siwe: SiweConfig;
  /** Injectable clock for the SIWE `Issued At` (ISO). */
  readonly now?: () => string;
  /** Session sink; defaults to the wallet-auth store. */
  readonly sink?: WalletAuthSink;
}

const DEFAULT_SINK = (): WalletAuthSink => useWalletAuthStore.getState();

export class WalletAuthController {
  constructor(private readonly options: WalletAuthOptions) {}

  async authenticate(): Promise<SessionResponse> {
    const sink = this.sink();
    try {
      sink.setStatus("connecting");
      const address = await this.options.signer.connect();

      sink.setStatus("authenticating");
      const { nonce } = await this.options.authClient.getNonce();
      const message = buildSiweMessage({
        domain: this.options.siwe.domain,
        address,
        uri: this.options.siwe.uri,
        chainId: this.options.siwe.chainId,
        nonce,
        issuedAt: this.nowIso(),
        statement: this.options.siwe.statement,
      });
      const signature = await this.options.signer.signMessage(address, message);

      const session = await this.options.authClient.verify(message, signature);
      sink.setSession(session.address, session.token);
      return session;
    } catch (err) {
      sink.setStatus("error", err instanceof Error ? err.message : "wallet auth failed");
      throw err;
    }
  }

  disconnect(): void {
    this.sink().reset();
  }

  private nowIso(): string {
    return this.options.now ? this.options.now() : new Date().toISOString();
  }

  private sink(): WalletAuthSink {
    return this.options.sink ?? DEFAULT_SINK();
  }
}
