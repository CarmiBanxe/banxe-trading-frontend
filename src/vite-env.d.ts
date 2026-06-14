/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Order-book WebSocket URL. When unset, the page uses a deterministic mock feed. */
  readonly VITE_ORDERBOOK_WS_URL?: string;
  /** Backend auth API base (WalletAuthPort). Defaults to "/api/v1". */
  readonly VITE_AUTH_API_URL?: string;
  /** Wallet provider: "mock" (default), "injected" (MetaMask), or "walletconnect". */
  readonly VITE_WALLET_PROVIDER?: string;
  /** ⛔ OPERATOR-GATED WalletConnect project id — not wired in this scaffold. */
  readonly VITE_WALLETCONNECT_PROJECT_ID?: string;
  /** DSE provider: "mock" (default, no network) or "http" (backend advisory API). */
  readonly VITE_DSE_PROVIDER?: string;
  /** Backend DSE API base. Defaults to "/api/v1". */
  readonly VITE_DSE_API_URL?: string;
  /** Execution intent-preview provider: "mock" (default, no network) or "http". */
  readonly VITE_EXECUTION_PROVIDER?: string;
  /** Backend internal execution API base. Defaults to "/api/v1". */
  readonly VITE_EXECUTION_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
