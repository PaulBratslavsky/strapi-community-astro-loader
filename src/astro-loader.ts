import { z } from 'zod';
import qs from 'qs';
import type { Loader } from 'astro/loaders';
import type { ZodTypeAny, ZodObject } from 'zod';

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
}

interface ImportMetaEnv {
  readonly STRAPI_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export function strapiLoader({
  contentType,
  strapiUrl = (import.meta as unknown as ImportMeta).env.STRAPI_BASE_URL || 'http://localhost:1337',
  syncInterval = 60 * 1000,
  params = {},
}: StrapiLoaderOptions): Loader {
  checkEnvironmentVariables(strapiUrl);

  console.log('Loader initialized with params:', params);

  return {
    name: `strapi-${contentType}`,

    load: async function (this: Loader, { store, meta, logger }) {
      const lastSynced = meta.get('lastSynced');

      if (lastSynced && Date.now() - Number(lastSynced) < syncInterval) {
        logger.info('Skipping Strapi sync');
        return;
      }

      logger.info(`Fetching ${contentType} from Strapi with params: ${JSON.stringify(params)}`);

      try {
        const data = await fetchFromStrapi(`/api/${contentType}s`, strapiUrl, params);
        const items = data?.data;

        if (!items || !Array.isArray(items)) {
          throw new Error('Invalid data received from Strapi');
        }

        const schemaOrFn = this.schema;
        if (!schemaOrFn) {
          throw new Error('Schema is not defined');
        }
        const schema =
          typeof schemaOrFn === 'function' ? await schemaOrFn() : schemaOrFn;
        if (!(schema instanceof z.ZodType)) {
          throw new Error('Invalid schema: expected a Zod schema');
        }

        type Item = z.infer<typeof schema>;

        store.clear();
        items.forEach((item: Item) => store.set({ id: item.id, data: item }));

        meta.set('lastSynced', String(Date.now()));
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
        throw new Error('Invalid schema data received from Strapi');
      }
      return generateZodSchema(data.attributes);
    },
  };
}

/**
 * Maps Strapi field types to Zod schema types
 * @param type The Strapi field type
 * @param field The field configuration object
 * @returns A Zod schema corresponding to the Strapi field type
 */

function mapTypeToZodSchema(type: string, field: any): ZodTypeAny {
  const schemaMap: Record<string, () => ZodTypeAny> = {
    string: () => z.string(),
    uid: () => z.string(),
    media: () =>
      z.object({
        allowedTypes: z.array(z.enum(field.allowedTypes)),
        type: z.literal('media'),
        multiple: z.boolean(),
        url: z.string(),
        alternativeText: z.string().optional(),
        caption: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional(),
      }),
    richtext: () => z.string(),
    datetime: () => z.string().datetime(),
    relation: () =>
      z
        .object({
          relation: z.literal(field.relation),
          target: z.literal(field.target),
          configurable: z.boolean().optional(),
          writable: z.boolean().optional(),
          visible: z.boolean().optional(),
          useJoinTable: z.boolean().optional(),
          private: z.boolean().optional(),
        })
        .optional(),
    boolean: () => z.boolean(),
    number: () => z.number(),
    array: () => z.array(mapTypeToZodSchema(field.items.type, field.items)),
    object: () => {
      const shape: Record<string, ZodTypeAny> = {};
      for (const [key, value] of Object.entries(field.properties)) {
        if (typeof value === 'object' && value !== null && 'type' in value) {
          shape[key] = mapTypeToZodSchema(value.type as string, value);
        } else {
          throw new Error(`Invalid field value for key: ${key}`);
        }
      }
      return z.object(shape);
    },
    text: () => z.string(),
    dynamiczone: () => z.array(z.object({ __component: z.string() })),
  };

  return (schemaMap[type] || (() => z.any()))();
}

/**
 * Generates a Zod schema from Strapi content type attributes
 * @param attributes The Strapi content type attributes
 * @returns A Zod object schema representing the content type
 */
function generateZodSchema(attributes: Record<string, any>): ZodObject<any> {
  const shape: Record<string, ZodTypeAny> = {};
  for (const [key, value] of Object.entries(attributes)) {
    const { type, ...rest } = value;
    shape[key] = mapTypeToZodSchema(type, rest);
  }
  return z.object(shape);
}

/**
 * Fetches data from the Strapi API
 * @param path The API endpoint path
 * @param params Optional query parameters
 * @returns The JSON response from the API
 */
async function fetchFromStrapi(
  path: string,
  strapiUrl: string,
  params?: object
): Promise<any> {
  const url = new URL(path, strapiUrl);
  console.log("Params from call: ", params);
  if (params) {
    url.search = qs.stringify(params);
  }

  try {
    console.log(`Fetching from Strapi: ${url.href}`);
    const response = await fetch(url.href);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Strapi API error (${response.status}): ${errorText}`);
    }
    
    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch failed')) {
      throw new Error(`Failed to connect to Strapi at ${url.href}. Is the server running?`);
    }
    throw error;
  }
}

// Ensure the required environment variable is set
function checkEnvironmentVariables(strapiUrl: string) {
  if (!strapiUrl) {
    throw new Error(
      'STRAPI_BASE_URL is not set. Please provide it as a parameter or set PUBLIC_STRAPI_URL in your environment.'
    );
  }
}



