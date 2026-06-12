import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  WalletAuthController,
  buildSiweMessage,
  createMockSigner,
  createHttpAuthClient,
  useWalletAuthStore,
} from "../../src/features/wallet-auth";
import type { AuthClient } from "../../src/features/wallet-auth";

const ADDRESS = "0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A";

function mockAuthClient(overrides: Partial<AuthClient> = {}): AuthClient {
  return {
    getNonce: vi.fn(async () => ({
      nonce: "nonce-abc",
      issuedAt: "2026-06-12T00:00:00Z",
      expiresAt: "2026-06-12T00:05:00Z",
    })),
    verify: vi.fn(async (_message: string, _signature: string) => ({
      address: ADDRESS,
      token: "opaque-session-token",
      expiresAt: "2026-06-13T00:00:00Z",
    })),
    ...overrides,
  };
}

function controller(authClient: AuthClient): WalletAuthController {
  return new WalletAuthController({
    signer: createMockSigner({ address: ADDRESS }),
    authClient,
    siwe: { domain: "localhost", uri: "https://localhost", chainId: 1, statement: "Sign in." },
    now: () => "2026-06-12T00:00:01Z",
  });
}

describe("buildSiweMessage", () => {
  it("produces an EIP-4361 message with domain, address, and nonce", () => {
    const msg = buildSiweMessage({
      domain: "localhost",
      address: ADDRESS,
      uri: "https://localhost",
      chainId: 1,
      nonce: "nonce-abc",
      issuedAt: "2026-06-12T00:00:00Z",
    });
    expect(msg.startsWith("localhost wants you to sign in with your Ethereum account:")).toBe(true);
    expect(msg).toContain(ADDRESS);
    expect(msg).toContain("Nonce: nonce-abc");
    expect(msg).toContain("Chain ID: 1");
  });
});

describe("WalletAuthController (mock signer + mocked backend, no network)", () => {
  beforeEach(() => {
    useWalletAuthStore.getState().reset();
  });

  it("completes the SIWE round-trip and stores the session in memory", async () => {
    const auth = mockAuthClient();
    const session = await controller(auth).authenticate();

    expect(auth.getNonce).toHaveBeenCalledOnce();
    // verify receives the SIWE message (with our nonce) + the signer's signature
    expect(auth.verify).toHaveBeenCalledOnce();
    const [message, signature] = (auth.verify as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(message).toContain("Nonce: nonce-abc");
    expect(signature).toMatch(/^0x[0-9a-f]+$/i);

    expect(session.token).toBe("opaque-session-token");
    const state = useWalletAuthStore.getState();
    expect(state.status).toBe("authenticated");
    expect(state.address).toBe(ADDRESS);
    expect(state.token).toBe("opaque-session-token");
  });

  it("surfaces a rejection from the backend and stores no session", async () => {
    const auth = mockAuthClient({
      verify: vi.fn(async () => {
        throw new Error("auth/verify rejected: 401");
      }),
    });
    await expect(controller(auth).authenticate()).rejects.toThrow(/401/);
    const state = useWalletAuthStore.getState();
    expect(state.status).toBe("error");
    expect(state.token).toBeNull();
  });

  it("disconnect clears the in-memory session", async () => {
    const ctrl = controller(mockAuthClient());
    await ctrl.authenticate();
    expect(useWalletAuthStore.getState().token).not.toBeNull();
    ctrl.disconnect();
    const state = useWalletAuthStore.getState();
    expect(state.status).toBe("disconnected");
    expect(state.token).toBeNull();
  });
});

describe("createHttpAuthClient (injected fetch, no network)", () => {
  it("GET /auth/nonce parses the nonce response", async () => {
    const fetchFn = vi.fn(async () =>
      new Response(
        JSON.stringify({ nonce: "n1", issuedAt: "t0", expiresAt: "t1" }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    const client = createHttpAuthClient("http://api.test/api/v1", fetchFn as typeof fetch);
    const res = await client.getNonce();
    expect(res.nonce).toBe("n1");
    expect(fetchFn).toHaveBeenCalledWith("http://api.test/api/v1/auth/nonce", { method: "GET" });
  });

  it("POST /auth/verify throws on a 401 rejection", async () => {
    const fetchFn = vi.fn(async () => new Response("unauthorized", { status: 401 }));
    const client = createHttpAuthClient("http://api.test/api/v1", fetchFn as typeof fetch);
    await expect(client.verify("msg", "0xsig")).rejects.toThrow(/401/);
  });
});
