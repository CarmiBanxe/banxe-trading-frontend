/**
 * TradeProxy URL map — typed, env-driven config.
 * No secrets; base URLs come from VITE_* env vars at build time.
 */

export interface TradeProxyConfig {
  readonly baseUrl: string;
  readonly wsUrl: string;
}

function envOrDefault(key: string, fallback: string): string {
  // Vite exposes VITE_* env vars on import.meta.env
  const val =
    typeof import.meta !== "undefined" &&
    import.meta.env &&
    (import.meta.env[key] as string | undefined);
  return val || fallback;
}

export function getTradeProxyConfig(): TradeProxyConfig {
  return {
    baseUrl: envOrDefault("VITE_TRADE_PROXY_URL", "http://localhost:8080"),
    wsUrl: envOrDefault("VITE_TRADE_PROXY_WS", "ws://localhost:8080/ws"),
  };
}

/** REST endpoint paths (no trailing slash). */
export const TRADE_ENDPOINTS = {
  orderBook: (symbol: string): string => `/api/v1/orderbook/${symbol}`,
  placeOrder: "/api/v1/orders",
  cancelOrder: (orderId: string): string => `/api/v1/orders/${orderId}`,
  positions: "/api/v1/positions",
  balances: "/api/v1/balances",
} as const;

/** Backend §D2 order-book WS path (no /api/v1 prefix; per BFF ws router). */
export const ORDERBOOK_WS_PATH = (symbol: string): string => `/orderbook/${symbol}`;

/**
 * S6.8 wire-not-build: resolve the per-symbol order-book WS URL.
 *
 * Priority (mock stays the CI/dev default — IL-185, ADR-102 reuse):
 *   1. VITE_ORDERBOOK_WS_URL (explicit per-symbol override, unchanged) → return as-is.
 *   2. VITE_TRADE_PROXY_WS (BFF WS base, S6.8) → append /orderbook/{symbol}.
 *   3. neither set → null, signalling the caller to use the deterministic mock.
 *
 * The default in `getTradeProxyConfig` is intentionally NOT consulted here, so
 * pages stay mock-default unless an env var is explicitly provided.
 */
export function resolveOrderBookWsUrl(symbol: string): string | null {
  const explicit =
    typeof import.meta !== "undefined" && import.meta.env
      ? (import.meta.env.VITE_ORDERBOOK_WS_URL as string | undefined)
      : undefined;
  if (explicit) return explicit;
  const proxyWs =
    typeof import.meta !== "undefined" && import.meta.env
      ? (import.meta.env.VITE_TRADE_PROXY_WS as string | undefined)
      : undefined;
  if (!proxyWs) return null;
  return `${proxyWs.replace(/\/$/, "")}${ORDERBOOK_WS_PATH(symbol)}`;
}
