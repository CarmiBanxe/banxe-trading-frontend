import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SandboxPortalPage } from "../../src/pages/sandbox-portal";
import { createMockSandboxClient } from "../../src/features/sandbox-portal";

describe("SandboxPortalPage", () => {
  it("always shows the sandbox / no-live-execution banner", () => {
    render(<SandboxPortalPage client={createMockSandboxClient()} />);
    expect(screen.getByTestId("sandbox-banner")).toHaveTextContent("No live execution");
  });

  it("renders all sandbox sections from mock responses", async () => {
    render(<SandboxPortalPage client={createMockSandboxClient()} />);
    await waitFor(() => expect(screen.getByTestId("sandbox-status")).toBeInTheDocument());
    expect(screen.getByTestId("sandbox-scenarios")).toBeInTheDocument();
    expect(screen.getByTestId("sandbox-sessions")).toBeInTheDocument();
    expect(screen.getByTestId("sandbox-partners")).toBeInTheDocument();
    expect(screen.getByTestId("sandbox-gamification")).toBeInTheDocument();
  });

  it("surfaces the mock sandbox status (unsigned-preview-only, no live)", async () => {
    render(<SandboxPortalPage client={createMockSandboxClient()} />);
    const status = await screen.findByTestId("sandbox-status");
    expect(status).toHaveTextContent("unsigned-preview-only");
    expect(status).toHaveTextContent("false"); // liveProvidersEnabled
  });

  it("shows an error message if the client rejects", async () => {
    const failing = {
      ...createMockSandboxClient(),
      getStatus: () => Promise.reject(new Error("boom")),
    };
    render(<SandboxPortalPage client={failing} />);
    await waitFor(() => expect(screen.getByTestId("sandbox-error")).toHaveTextContent("boom"));
  });
});
