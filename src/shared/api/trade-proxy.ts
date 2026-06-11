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
