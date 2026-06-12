/**
 * Wallet connector seam — an injectable signer abstraction.
 *
 * The default in dev/CI is a **mock signer** (no real wallet, no network), so
 * tests are deterministic. A real injected (MetaMask / EIP-1193) signer is used
 * only when configured. WalletConnect needs an operator-provided project id and
 * is intentionally left as a flagged, unwired seam (gated).
 */

export interface WalletSigner {
  /** Connect the wallet and return the selected address (0x…). */
  connect(): Promise<string>;
  /** Sign a plain-text message (personal_sign / EIP-191). */
  signMessage(address: string, message: string): Promise<string>;
}

/** Minimal EIP-1193 provider surface (e.g. MetaMask's window.ethereum). */
export interface Eip1193Provider {
  request(args: { method: string; params?: readonly unknown[] }): Promise<unknown>;
}

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

/** Real signer over an injected EIP-1193 provider (MetaMask). No project key. */
export function createInjectedSigner(
  provider: Eip1193Provider | undefined = globalThis.window?.ethereum,
): WalletSigner {
  function ensure(): Eip1193Provider {
    if (!provider) {
      throw new Error("no injected wallet (window.ethereum) found");
    }
    return provider;
  }
  return {
    async connect(): Promise<string> {
      const accounts = (await ensure().request({ method: "eth_requestAccounts" })) as string[];
      const address = accounts?.[0];
      if (!address) {
        throw new Error("wallet returned no account");
      }
      return address;
    },
    async signMessage(address: string, message: string): Promise<string> {
      return (await ensure().request({
        method: "personal_sign",
        params: [message, address],
      })) as string;
    },
  };
}

export interface MockSignerOptions {
  readonly address?: string;
  readonly signature?: string;
}

/** Deterministic signer for dev/CI — never touches a real wallet or network. */
export function createMockSigner(opts: MockSignerOptions = {}): WalletSigner {
  const address = opts.address ?? "0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A";
  const signature = opts.signature ?? `0x${"ab".repeat(65)}`;
  return {
    connect: () => Promise.resolve(address),
    signMessage: () => Promise.resolve(signature),
  };
}

export type WalletProviderKind = "mock" | "injected" | "walletconnect";

/**
 * Select a signer by provider kind. Default "mock".
 *
 * ⛔ OPERATOR-GATED: "walletconnect" requires an operator-provided
 * `VITE_WALLETCONNECT_PROJECT_ID` and a connector wiring that is intentionally
 * NOT included here. Selecting it without that wiring throws.
 */
export function selectSigner(kind: WalletProviderKind): WalletSigner {
  switch (kind) {
    case "injected":
      return createInjectedSigner();
    case "walletconnect":
      throw new Error(
        "WalletConnect requires an operator-provided project id (gated) — not wired",
      );
    default:
      return createMockSigner();
  }
}
