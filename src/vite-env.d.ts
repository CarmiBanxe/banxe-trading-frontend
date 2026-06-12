/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Order-book WebSocket URL. When unset, the page uses a deterministic mock feed. */
  readonly VITE_ORDERBOOK_WS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
