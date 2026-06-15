import { OrderBookPage } from "@/pages/order-book";
import { SandboxPortalPage } from "@/pages/sandbox-portal";

/**
 * The internal Sandbox Portal (SBOX-6) is opt-in and dev/sandbox-only: it renders
 * when VITE_SANDBOX_PORTAL="1" or the URL carries ?sandbox. Otherwise the default
 * trading page is shown. The portal is read-only over /api/v1/sandbox/* and exposes
 * no live action.
 */
function sandboxPortalEnabled(): boolean {
  if (import.meta.env.VITE_SANDBOX_PORTAL === "1") {
    return true;
  }
  return typeof window !== "undefined" && window.location.search.includes("sandbox");
}

export function App(): JSX.Element {
  return sandboxPortalEnabled() ? <SandboxPortalPage /> : <OrderBookPage />;
}
