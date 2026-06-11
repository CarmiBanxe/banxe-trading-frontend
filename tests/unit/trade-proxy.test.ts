import { describe, it, expect } from "vitest";
import { TRADE_ENDPOINTS } from "../../src/shared/api/trade-proxy";

describe("TradeProxy URL map", () => {
  it("orderBook endpoint includes symbol", () => {
    expect(TRADE_ENDPOINTS.orderBook("BTCUSDT")).toBe(
      "/api/v1/orderbook/BTCUSDT",
    );
  });

  it("cancelOrder endpoint includes orderId", () => {
    expect(TRADE_ENDPOINTS.cancelOrder("abc-123")).toBe(
      "/api/v1/orders/abc-123",
    );
  });

  it("static endpoints are strings", () => {
    expect(TRADE_ENDPOINTS.placeOrder).toBe("/api/v1/orders");
    expect(TRADE_ENDPOINTS.positions).toBe("/api/v1/positions");
    expect(TRADE_ENDPOINTS.balances).toBe("/api/v1/balances");
  });
});
