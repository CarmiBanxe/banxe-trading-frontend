/**
 * SIWE (Sign-In-with-Ethereum, EIP-4361) message builder — pure.
 *
 * The backend (WalletAuthPort) verifies the signature over this exact message.
 * Self-custodial: the user's wallet signs; no key ever leaves the wallet.
 */

export interface SiweParams {
  readonly domain: string;
  readonly address: string;
  readonly uri: string;
  readonly chainId: number;
  readonly nonce: string;
  readonly issuedAt: string; // ISO 8601 UTC
  readonly version?: string;
  readonly statement?: string;
  readonly expirationTime?: string;
}

export function buildSiweMessage(p: SiweParams): string {
  const lines = [`${p.domain} wants you to sign in with your Ethereum account:`, p.address, ""];
  if (p.statement) {
    lines.push(p.statement, "");
  }
  lines.push(
    `URI: ${p.uri}`,
    `Version: ${p.version ?? "1"}`,
    `Chain ID: ${p.chainId}`,
    `Nonce: ${p.nonce}`,
    `Issued At: ${p.issuedAt}`,
  );
  if (p.expirationTime) {
    lines.push(`Expiration Time: ${p.expirationTime}`);
  }
  return lines.join("\n");
}
