import { beforeEach, describe, expect, it, vi } from "vitest";
import { strapiLoader } from "./astro-loader";
import type { StrapiLoaderOptions } from "./options";
import type { Loader, LoaderContext } from "astro/loaders";
import {
  CLIENT_CONFIG,
  mockLoaderContext,
  PAGES,
  TYPE,
} from "../test/test.utils";
import type { ZodType } from "astro/zod";
import {
  NOW,
  NOW_STR,
  TEN_SECONDS_AGO_STR,
  TEN_SECONDS_IN_MS,
  THIRTY_SECONDS_AGO_STR,
  THIRTY_SECONDS_IN_MS,
} from "../test/date.constants";

describe("astroLoader", () => {
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

    /**
     * These are the repeated tests that should be run for each set up that results in a sync.
     */
    function syncSpecs() {
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

      it("should throw error when invalid data returned from Strapi", async () => {
        const invalidResponseShapeLoader = strapiLoader({
          ...MINIMAL_LOADER_OPTS,
          contentType: "invalidShape",
        });
        await expect(
          invalidResponseShapeLoader.load(context),
        ).rejects.toThrowError();
      });

      it("should store nothing when empty data list returned from Strapi", async () => {
        const emptyLoader = strapiLoader({
          ...MINIMAL_LOADER_OPTS,
          contentType: "empty",
        });
        await emptyLoader.load(context);
        expect(context.store.entries().length).toBe(0);
        expect(context.parseData).toHaveBeenCalledTimes(0);
        expect(context.generateDigest).toHaveBeenCalledTimes(0);
      });

      it("should throw error when Strapi API fails", async () => {
        const errorLoader = strapiLoader({
          ...MINIMAL_LOADER_OPTS,
          contentType: "error",
        });
        await expect(errorLoader.load(context)).rejects.toThrowError();
      });
    }

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

      syncSpecs();
    });

    describe("without previous sync", async () => {
      beforeEach(() => {
        context = mockLoaderContext();
        loader = strapiLoader(MINIMAL_LOADER_OPTS);
      });

      syncSpecs();
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

      it("should skip syncing", async () => {
        await loader.load(context);
        expect(context.store.entries.length).toBe(0);
        expect(context.meta.get("lastSynced")).toEqual(TEN_SECONDS_AGO_STR);
      });
    });

    it("should name loader based on content type", () => {
      const { name } = strapiLoader({
        contentType: TYPE,
        clientConfig: CLIENT_CONFIG,
      });
      expect(name).toEqual(TYPE);
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
