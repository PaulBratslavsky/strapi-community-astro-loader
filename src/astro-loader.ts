import type { Loader, LoaderContext } from "astro/loaders";
import {
  getPaginationInfo,
  checkEnvironmentVariables,
  fetchFromStrapi,
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

export function strapiLoader<T extends { id: number | string }>({
  contentType,
  strapiUrl = (import.meta as unknown as ImportMeta).env.STRAPI_BASE_URL ||
    "http://localhost:1337",
  syncInterval = 60 * 1000,
  params = {},
  // TODO: use pageSize in the `fetchFromStrapi` calls. (It was previously only being used in the schema calls.)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  pageSize = 25,
}: StrapiLoaderOptions): Loader {
  checkEnvironmentVariables(strapiUrl);

  console.log("Loader initialized with params:", params);

  return {
    name: `strapi-${contentType}`,

    load: async function (
      this: Loader,
      { store, meta, logger }: LoaderContext,
    ) {
      const lastSynced = meta.get("lastSynced");

      if (lastSynced && Date.now() - Number(lastSynced) < syncInterval) {
        logger.info("Skipping Strapi sync");
        return;
      }

      logger.info(
        `Fetching ${contentType} from Strapi with params: ${JSON.stringify(
          params,
        )}`,
      );

      try {
        const content = [] as T[];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const data = await fetchFromStrapi<T>(contentType, params);

          if (data?.data && Array.isArray(data.data)) {
            content.push(...data.data);
            console.log(`Fetched ${data.data.length} items from Strapi`);
          } else {
            console.warn("No valid data received from Strapi");
          }

          const { currentPage, totalPages } = getPaginationInfo(data);
          hasMore = Boolean(
            currentPage && totalPages && currentPage < totalPages,
          );
          // TODO: is page being used for anything?
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          page++;
          if (!content.length) {
            throw new Error("No content items received from Strapi");
          }

          // Clear the store before processing new items
          store.clear();

          for (const item of content) {
            if (item && item.id) {
              try {
                store.set({ id: String(item.id), data: item });

                console.log(
                  `Stored item ${item.id} with data keys:`,
                  Object.keys(item),
                );
              } catch (error) {
                console.error(`Error processing item ${item.id}:`, error);
                logger.error(
                  `Error processing item ${item.id}: ${(error as Error).message}`,
                );
              }
            }
          }

          // Verify data in store
          const keys = store.keys();
          console.log(`Store contains ${keys.length} entries`);

          if (keys.length > 0) {
            const firstKey = keys[0];
            if (firstKey) {
              // Guard against undefined
              const entry = store.get(firstKey);
              if (entry?.data) {
                // Check if data exists
                console.log(
                  `First item (${firstKey}) data keys:`,
                  Object.keys(entry.data),
                );
              } else {
                console.log(`First item (${firstKey}) has NO DATA`);
              }
            }
          }

          meta.set("lastSynced", String(Date.now()));
        }
      } catch (error) {
        console.error("LOADER ERROR:", error);
        logger.error(
          `Error loading Strapi content: ${(error as Error).message}`,
        );
        throw error;
      }
    },
    schema: () => {
      throw new Error(
        "This default schema should not be used. Please specify your own when using `strapiLoader`.",
      );
    },
  };
}

export { fetchFromStrapi };
