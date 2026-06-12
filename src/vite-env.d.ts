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
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
