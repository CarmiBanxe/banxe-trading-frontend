export { buildSiweMessage } from "./siwe";
export type { SiweParams } from "./siwe";

export {
  createInjectedSigner,
  createMockSigner,
  selectSigner,
} from "./connector";
export type {
  WalletSigner,
  Eip1193Provider,
  MockSignerOptions,
  WalletProviderKind,
} from "./connector";

export { createHttpAuthClient } from "./auth-client";
export type { AuthClient, NonceResponse, SessionResponse } from "./auth-client";

export { useWalletAuthStore } from "./store";
export type { WalletAuthState, WalletAuthStatus } from "./store";

export { WalletAuthController } from "./controller";
export type {
  WalletAuthOptions,
  WalletAuthSink,
  SiweConfig,
} from "./controller";

export { buildWalletAuthController } from "./build";
