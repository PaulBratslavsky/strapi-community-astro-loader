import { z } from "zod";
import type { Loader, LoaderContext } from "astro/loaders";
import {
  getPaginationInfo,
  checkEnvironmentVariables,
  fetchFromStrapi,
  inferSchemaFromResponse,
} from "../utils";

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

    load: async function (this: Loader, { store, meta, logger, parseData }: LoaderContext) {
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
          const data = await fetchFromStrapi(contentType, params);

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

          // Clear existing data
          store.clear();
          
          // Process each item through parseData to ensure proper schema validation and type preservation
          for (const item of items) {
            // This is the critical step that ensures type information is preserved
            const parsedEntry = await parseData({
              id: item.id.toString(),
              data: item,
            });
            
            // Store the validated data with preserved type information
            store.set({
              id: parsedEntry.id,
              data: parsedEntry.data,
            });
          }

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
      // Fetch with deep population
      const response = await fetchFromStrapi(
        contentType,
        {
          ...params,
          pagination: {
            page: 1,
            pageSize: pageSize,
          },
        }
      );

      if (!response?.data || !Array.isArray(response.data) || response.data.length === 0) {
        throw new Error("No data available to infer schema");
      }
      
      const sampleData = response.data[0];
      console.log("SAMPLE DATA:", JSON.stringify(sampleData, null, 2));
      
      const schema = inferSchemaFromResponse(sampleData);
      
      // Safe schema structure logging
      console.log("SCHEMA STRUCTURE:", 
        schema._def ? 
          `Root type: ${schema._def.typeName}` : 
          "Unable to inspect schema"
      );
      
      return schema;
    },
  };
}

export { fetchFromStrapi };
