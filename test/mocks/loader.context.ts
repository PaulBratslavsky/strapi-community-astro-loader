import { MockDataStore } from "./data.store";
import { MockIntegrationLogger } from "./integration.logger";
import { vi } from "vitest";
import type { LoaderContext, ParseDataOptions } from "astro/loaders";

export function mockLoaderContext() {
  return {
    store: new MockDataStore(),
    meta: new Map<string, string>(),
    logger: new MockIntegrationLogger(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parseData: vi.fn(async ({ data }: ParseDataOptions<any>) => data),
    generateDigest: vi.fn((data: Record<string, unknown> | string) =>
      typeof data === "string" ? data : Object.entries(data).toString(),
    ),
  } satisfies Partial<LoaderContext> as unknown as LoaderContext;
}
