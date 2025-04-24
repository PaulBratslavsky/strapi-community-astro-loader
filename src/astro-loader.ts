import { z } from "zod";
import type { Loader, LoaderContext } from 'astro/loaders';

import {
  getPaginationInfo,
  generateZodSchema,
  checkEnvironmentVariables,
  fetchFromStrapi,
} from "./utils";

/**
 * Creates a Strapi content loader for Astro
 * @param contentType The Strapi content type to load
 * @returns An Astro loader for the specified content type
 */

interface StrapiLoaderOptions {
  contentType: string;
  strapiUrl?: string;
  syncInterval?: number;
  params?: object;
  pageSize?: number;
}

interface ImportMetaEnv {
  readonly STRAPI_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export function strapiLoader({
  contentType,
  strapiUrl = (import.meta as unknown as ImportMeta).env.STRAPI_BASE_URL ||
    "http://localhost:1337",
  syncInterval = 60 * 1000,
  params = {},
  pageSize = 25,
}: StrapiLoaderOptions): Loader {
  checkEnvironmentVariables(strapiUrl);

  console.log("Loader initialized with params:", params);

  return {
    name: `strapi-${contentType}`,
    load: async function(this: Loader, context: LoaderContext): Promise<void> {
      const { store, meta, logger } = context;
      const lastSynced = meta.get("lastSynced");

      if (lastSynced && Date.now() - Number(lastSynced) < syncInterval) {
        logger.info("Skipping Strapi sync");
        return;
      }

      logger.info(
        `Fetching ${contentType} from Strapi with params: ${JSON.stringify(
          params
        )}`
      );

      try {
        const content = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const data = await fetchFromStrapi(
            `/api/${contentType}s`,
            strapiUrl,
            {
              ...params,
              pagination: {
                page,
                pageSize: pageSize,
              },
            }
          );

          content.push(...data?.data);

          const { currentPage, totalPages } = getPaginationInfo(data);
          hasMore = Boolean(
            currentPage && totalPages && currentPage < totalPages
          );
          page++;

          const items = content;

          if (!items || !Array.isArray(items)) {
            throw new Error("Invalid data received from Strapi");
          }

          const schemaOrFn = this.schema;

          if (!schemaOrFn) {
            throw new Error("Schema is not defined");
          }

          const schema =
            typeof schemaOrFn === "function" ? await schemaOrFn() : schemaOrFn;

          if (!(schema instanceof z.ZodType)) {
            throw new Error("Invalid schema: expected a Zod schema");
          }

          type Item = z.infer<typeof schema>;

          store.clear();
          items.forEach((item: Item) => store.set({ id: item.id, data: item }));

          meta.set("lastSynced", String(Date.now()));
        }
      } catch (error) {
        logger.error(
          `Error loading Strapi content: ${(error as Error).message}`
        );
        throw error;
      }
    },

    schema: async () => {
      const data = await fetchFromStrapi(
        `/get-strapi-schema/schema/${contentType}`,
        strapiUrl
      );
      if (!data?.attributes) {
        throw new Error("Invalid schema data received from Strapi");
      }
      return generateZodSchema(data.attributes);
    },
  };
}

