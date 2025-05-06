import type { LoaderContext, ParseDataOptions } from "astro/loaders";
import { vi } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type { Config } from "@strapi/client";
import { MockDataStore } from "./mocks/data.store";
import { MockIntegrationLogger } from "./mocks/integration.logger";

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

export function handlers(url: string, contentTypes: Record<string, object[]>) {
  return Object.keys(contentTypes).map((contentType) => {
    const contentTypeUrl = `${url}/${contentType}s`;
    return http.get(contentTypeUrl, ({ request }) => {
      const data = contentTypes[contentType];
      const searchParams = new URL(request.url).searchParams;
      const pageSize = Number(
        searchParams.get("pagination[pageSize]") || data.length,
      );
      const pageCount = Math.ceil(data.length / pageSize);
      const page = Math.max(
        0,
        Math.min(
          Number(searchParams.get("pagination[page]") || 1) - 1,
          pageCount - 1,
        ),
      );
      return HttpResponse.json({
        data: data.slice(page * pageSize, page * pageSize + pageSize),
        meta: {
          pagination: { pageCount, page, pageSize, total: data.length },
        },
      });
    });
  });
}

const ABOUT_PAGE = {
  id: 6,
  documentId: "gny2yrqho5t9o4okxjqlpwqn",
  title: "About",
  description: "About page.",
  slug: "about",
  createdAt: "2025-03-05T19:13:40.938Z",
  updatedAt: "2025-04-26T20:18:50.480Z",
  publishedAt: "2025-04-26T20:18:50.488Z",
};
const COMPANY_PAGE = {
  id: 4,
  documentId: "dje64j42rlsry0p7lpnt87nb",
  title: "Our Company",
  description: "This will be page about our company.",
  slug: "our-company",
  createdAt: "2025-04-12T04:11:15.114Z",
  updatedAt: "2025-04-12T04:11:15.114Z",
  publishedAt: "2025-04-12T04:11:15.122Z",
};
export const PAGES = [COMPANY_PAGE, ABOUT_PAGE];
const BASE_URL = "http://localhost:1337/api";
export const TYPE = "testType";
export const CLIENT_CONFIG: Config = {
  baseURL: BASE_URL,
};
export const server = setupServer(...handlers(BASE_URL, { [TYPE]: PAGES }));
