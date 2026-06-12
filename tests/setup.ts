import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Stub lightweight-charts globally: jsdom has no real canvas, and CI must never
// instantiate a real chart (ADR-082 widget is exercised via its injectable
// adapter / pure transform instead). Page/App tests that mount DepthChartWidget
// with the default adapter therefore hit this harmless no-op chart.
vi.mock("lightweight-charts", () => ({
  createChart: () => ({
    addSeries: () => ({ setData: () => {} }),
    remove: () => {},
  }),
  AreaSeries: {},
}));
