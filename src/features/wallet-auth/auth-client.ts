/**
 * Auth HTTP client — talks to the backend WalletAuthPort (SIWE).
 *
 * Injectable `fetch` so CI never hits the network. Endpoints:
 *   GET  {base}/auth/nonce   → NonceResponse
 *   POST {base}/auth/verify  → SessionResponse (401 on bad signature/nonce)
 */

export interface NonceResponse {
  readonly nonce: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
}

export interface SessionResponse {
  readonly address: string;
  readonly token: string;
  readonly expiresAt: string;
}

export interface AuthClient {
  getNonce(): Promise<NonceResponse>;
  verify(message: string, signature: string): Promise<SessionResponse>;
}

export function createHttpAuthClient(
  baseUrl: string,
  fetchFn: typeof fetch = globalThis.fetch,
): AuthClient {
  const base = baseUrl.replace(/\/$/, "");
  return {
    async getNonce(): Promise<NonceResponse> {
      const resp = await fetchFn(`${base}/auth/nonce`, { method: "GET" });
      if (!resp.ok) {
        throw new Error(`auth/nonce failed: ${resp.status}`);
      }
      return (await resp.json()) as NonceResponse;
    },
    async verify(message: string, signature: string): Promise<SessionResponse> {
      const resp = await fetchFn(`${base}/auth/verify`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message, signature }),
      });
      if (!resp.ok) {
        throw new Error(`auth/verify rejected: ${resp.status}`);
      }
      return (await resp.json()) as SessionResponse;
    },
  };
}
