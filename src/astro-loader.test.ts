import { beforeEach, describe, expect, it, vi } from "vitest";
import { strapiLoader, type StrapiLoaderOptions } from "./astro-loader";
import type { Loader, LoaderContext } from "astro/loaders";
import { CLIENT_CONFIG, mockLoaderContext, PAGES, TYPE } from "./test.utils";
import type { ZodType } from "astro/zod";

describe("astroLoader", () => {
  const NOW = new Date(2000, 1, 1, 13);
  const NOW_STR = String(NOW.getTime());
  const ONE_SECOND_IN_MS = 1000;
  const TEN_SECONDS_IN_MS = ONE_SECOND_IN_MS * 10;
  const TEN_SECONDS_AGO = new Date(NOW.getTime() - TEN_SECONDS_IN_MS);
  const TEN_SECONDS_AGO_STR = String(TEN_SECONDS_AGO.getTime());
  const THIRTY_SECONDS_IN_MS = ONE_SECOND_IN_MS * 30;
  const THIRTY_SECONDS_AGO = new Date(NOW.getTime() - THIRTY_SECONDS_IN_MS);
  const THIRTY_SECONDS_AGO_STR = String(THIRTY_SECONDS_AGO.getTime());
  const MINIMAL_LOADER_OPTS: StrapiLoaderOptions = {
    contentType: TYPE,
    clientConfig: CLIENT_CONFIG,
  };

  beforeEach(() => {
    vi.setSystemTime(NOW);
  });

  describe("#load", () => {
    let loader: Loader;
    let context: LoaderContext;

    it("should name loader based on content type", () => {
      const { name } = strapiLoader({
        contentType: TYPE,
        clientConfig: CLIENT_CONFIG,
      });
      expect(name).toEqual(TYPE);
    });

    describe("with recent sync", async () => {
      beforeEach(() => {
        context = mockLoaderContext();
        context.meta.set("lastSynced", TEN_SECONDS_AGO_STR);
        loader = strapiLoader({
          ...MINIMAL_LOADER_OPTS,
          cacheDurationInMs: THIRTY_SECONDS_IN_MS,
        });
      });

      it("should skip syncing if it was recently synced", async () => {
        await loader.load(context);
        expect(context.store.entries.length).toBe(0);
        expect(context.meta.get("lastSynced")).toEqual(TEN_SECONDS_AGO_STR);
      });
    });

    describe("with stale sync", async () => {
      beforeEach(() => {
        context = mockLoaderContext();
        context.meta.set("lastSynced", THIRTY_SECONDS_AGO_STR);
        loader = strapiLoader({
          ...MINIMAL_LOADER_OPTS,
          cacheDurationInMs: TEN_SECONDS_IN_MS,
          pageSize: 1,
        });
      });

      it("should page through all content type data", async () => {
        const expectedDataStoreEntries = PAGES.map((page) => ({
          id: String(page.id),
          data: page,
          digest: Object.entries(page).toString(),
        }));
        await loader.load(context);
        expect(context.store.entries().length).toBe(PAGES.length);
        expect(context.parseData).toHaveBeenCalledTimes(PAGES.length);
        expect(context.generateDigest).toHaveBeenCalledTimes(PAGES.length);
        expectedDataStoreEntries.forEach((expectedEntry) => {
          expect(context.store.get(expectedEntry.id)).toEqual(expectedEntry);
        });
        expect(context.meta.get("lastSynced")).toEqual(NOW_STR);
      });

      it.todo("should throw error when invalid data returned from Strapi");
      it.todo("should throw error when empty data list returned from Strapi");
      it.todo("should throw error when Strapi API fails");
    });

    describe("without previous sync", async () => {
      beforeEach(() => {
        context = mockLoaderContext();
        loader = strapiLoader(MINIMAL_LOADER_OPTS);
      });

      it.todo(
        "in theory, we should do every test from the stale sync scenario.",
      );
    });
  });

  describe("#schema", () => {
    it("should throw Error if default schema is used", () => {
      const { schema } = strapiLoader(MINIMAL_LOADER_OPTS);
      expect(schema).toBeTypeOf("function");
      const schemaFunc = schema as () => ZodType;
      expect(() => {
        schemaFunc();
      }).toThrowError();
    });
  });
});
