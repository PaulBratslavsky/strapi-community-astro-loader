import type { AstroIntegrationLogger } from "astro";
import { vi } from "vitest";

export class MockIntegrationLogger implements AstroIntegrationLogger {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public options!: any;
  public label = "mock";

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public fork(_: string): AstroIntegrationLogger {
    return this;
  }

  public info = vi.fn();
  public warn = vi.fn();
  public error = vi.fn();
  public debug = vi.fn();
}
