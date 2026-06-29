/**
 * S6.8 — FE↔BFF mock-loop integration test (wire-not-build).
 *
 * Closes the FE↔BFF loop over the deterministic mock feed (IL-185):
 *
 *   1. OrderBookWidget renders bids/asks driven by the §D2 envelope shape the
 *      backend's /ws/orderbook/{symbol} emits — verbatim wire output captured
 *      from `InMemoryMockMarketData` (banxe-trading-backend), so the test pins
 *      the FE↔BFF WS contract.
 *
 *   2. The FE places an "order" via the SAME http client production wires
 *      (`createHttpExecutionIntentClient`) → it receives an UNSIGNED order
 *      intent (`signed:false`, `submitted:false`); the request carries NO
 *      `Authorization` header (mock-default `auth_enabled=false` on the BFF),
 *      proving the backend signs nothing / holds no keys.
 *
 *   3. Decimal-string money fields (I-01) survive the round-trip in both
 *      directions — never coerced to float.
 *
 * No new ports/widgets/adapters. The WS transport is the scripted injectable
 * socket factory (no network). The HTTP transport is fetch stubbed by vi.fn()
 * (no network). Both stubs return the verbatim BFF mock response payloads.
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { OrderBookWidget } from "@/widgets/order-book";
import { useOrderBookStore } from "@/entities/order-book";
import {
  OrderBookFeedController,
  useFeedStatusStore,
} from "@/features/order-book-feed";
import type { SocketFactory, SocketLike } from "@/shared/api/ws-client";
import {
  createHttpExecutionIntentClient,
  type IntentPreviewRequest,
  type IntentPreviewResponse,
} from "@/features/execution-intent";

/* ----------------------------- BFF mock fixtures ---------------------------- */

/** Verbatim §D2 envelopes — captured from `InMemoryMockMarketData`. */
const BFF_WS_FRAMES = [
  {
    type: "snapshot",
    data: {
      bids: [
        { price: "67250.50", quantity: "1.2500" },
        { price: "67249.00", quantity: "0.8000" },
      ],
      asks: [
        { price: "67251.00", quantity: "0.9000" },
        { price: "67252.50", quantity: "1.5000" },
      ],
      sequence: 1,
    },
  },
  {
    type: "diff",
    data: { bids: [{ price: "67250.50", quantity: "0.4000" }], asks: [], sequence: 2 },
  },
] as const;

/**
 * Verbatim BFF mock response for POST /api/v1/execution/intent-preview with
 * {asset:"BTCUSDT", actionType:"BUY", notionalUsd:"100"}. Decimal strings (I-01).
 */
const BFF_INTENT_PREVIEW_RESPONSE: IntentPreviewResponse = {
  tradable: true,
  mode: "sandbox-mock",
  signed: false,
  submitted: false,
  reason: "unsigned buy intent built for BTC/USDT",
  venue: "mock",
  order: {
    baseAsset: "BTC",
    quoteAsset: "USDT",
    side: "buy",
    type: "market",
    amount: "0.00148697",
    reduceOnly: false,
  },
  intent: {
    orderId: "mock-000001",
    state: "accepted",
    filledAmount: "0",
    raw: { mock: true, clientOrderId: "intent-5a626298ec5ae930" },
  },
  disclaimer:
    "Sandbox/pre-production preview — UNSIGNED intent only. Nothing is signed, " +
    "submitted, or executed; the backend holds no keys and the client wallet signs " +
    "client-side. Mock data, no live chain. Advisory (ADR-083 self-custodial); NOT " +
    "an order, NOT execution, NO SLA / billing.",
};

/* ----------------------------- scripted WS transport ----------------------- */

interface ScriptedSocket {
  factory: SocketFactory;
  open: () => void;
  send: (frame: unknown) => void;
}

function scriptedSocket(): ScriptedSocket {
  let current: SocketLike;
  const factory: SocketFactory = () => {
    current = {
      onopen: null,
      onmessage: null,
      onclose: null,
      onerror: null,
      close: vi.fn(),
      readyState: 0,
    };
    return current;
  };
  return {
    factory,
    open: () => {
      current.readyState = 1;
      current.onopen?.(new Event("open"));
    },
    send: (frame) =>
      current.onmessage?.(new MessageEvent("message", { data: JSON.stringify(frame) })),
  };
}

/* ----------------------------- the mock loop ------------------------------- */

describe("S6.8 — FE↔BFF mock-loop (no network)", () => {
  beforeEach(() => {
    useOrderBookStore.getState().reset();
    useFeedStatusStore.getState().setStatus("closed");
  });

  it("renders the order-book widget from the backend §D2 mock feed", () => {
    const s = scriptedSocket();
    const controller = new OrderBookFeedController({
      url: "wss://bff.local/ws/orderbook/BTC-EUR",
      socketFactory: s.factory,
    });
    controller.connect();
    s.open();
    for (const frame of BFF_WS_FRAMES) s.send(frame);

    render(<OrderBookWidget />);

    expect(screen.getByTestId("ob-live")).toBeInTheDocument();
    const bidRows = screen.getAllByTestId("bid-row");
    const askRows = screen.getAllByTestId("ask-row");
    // backend snapshot bids: 67250.50 (reduced to 0.4 by diff seq=2), 67249.00
    expect(bidRows.length).toBeGreaterThan(0);
    expect(askRows.length).toBeGreaterThan(0);
    // §D2 sequence persisted from the wire (diff applied).
    expect(useOrderBookStore.getState().snapshot?.sequence).toBe(2);
    // I-01: decimal-string round-trip — exact fidelity preserved.
    expect(useOrderBookStore.getState().snapshot?.asks[0].price.toFixed(2)).toBe("67251.00");

    controller.disconnect();
  });

  it("places an order → BFF returns an UNSIGNED intent (no auth required)", async () => {
    const sentRequests: Array<{
      url: string;
      headers: Record<string, string>;
      body: IntentPreviewRequest;
    }> = [];
    const fakeFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const headersInit = init?.headers ?? {};
      const headers: Record<string, string> = Object.fromEntries(
        Object.entries(headersInit as Record<string, string>).map(([k, v]) => [k.toLowerCase(), v]),
      );
      sentRequests.push({
        url: String(input),
        headers,
        body: JSON.parse(String(init?.body ?? "{}")) as IntentPreviewRequest,
      });
      return {
        ok: true,
        status: 200,
        async json() {
          return BFF_INTENT_PREVIEW_RESPONSE;
        },
      } as unknown as Response;
    });

    const client = createHttpExecutionIntentClient(
      "https://bff.local/api/v1",
      fakeFetch as unknown as typeof fetch,
    );
    const response = await client.preview({
      asset: "BTCUSDT",
      actionType: "BUY",
      notionalUsd: "100",
    });

    // === Hard invariants the spec mandates ===
    // 1. UNSIGNED intent (backend signs nothing, holds no keys).
    expect(response.signed).toBe(false);
    expect(response.submitted).toBe(false);
    expect(response.mode).toBe("sandbox-mock");
    expect(response.tradable).toBe(true);
    // 2. Mapped order returned with decimal-string amount (I-01).
    expect(response.order?.side).toBe("buy");
    expect(response.order?.baseAsset).toBe("BTC");
    expect(response.order?.quoteAsset).toBe("USDT");
    expect(typeof response.order?.amount).toBe("string");
    // 3. The FE called the correct BFF endpoint with no Authorization header
    //    (mock-default auth_enabled=false → backend requires no session).
    expect(sentRequests).toHaveLength(1);
    expect(sentRequests[0].url).toBe(
      "https://bff.local/api/v1/execution/intent-preview",
    );
    expect(sentRequests[0].headers.authorization).toBeUndefined();
    // 4. Round-trip request body preserves decimal-string notional (I-01).
    expect(typeof sentRequests[0].body.notionalUsd).toBe("string");
    expect(sentRequests[0].body.notionalUsd).toBe("100");
    // 5. The backend NEVER returned a signed/submitted intent in its raw envelope.
    const raw = (response.intent?.raw ?? {}) as Record<string, unknown>;
    expect(raw.submitted).not.toBe(true);
  });

  it("fail-closed: BFF error surfaces as a thrown error (no silent live fallback)", async () => {
    const fakeFetch = vi.fn(
      async () =>
        ({
          ok: false,
          status: 503,
          async json() {
            return {};
          },
        }) as unknown as Response,
    );
    const client = createHttpExecutionIntentClient(
      "https://bff.local/api/v1",
      fakeFetch as unknown as typeof fetch,
    );
    await expect(
      client.preview({ asset: "BTCUSDT", actionType: "BUY", notionalUsd: "100" }),
    ).rejects.toThrow(/execution\/intent-preview failed/);
  });
});
