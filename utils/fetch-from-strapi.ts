import { strapiClient } from "./strapi-client";

export interface StrapiResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      pageCount: number;
      pageSize: number;
      total: number;
    };
  };
  [key: string]: unknown; // Allow for additional properties
}

async function getCollectionType<T extends unknown[]>(
  name: string,
  params: object,
): Promise<StrapiResponse<T>> {
  const data = (await strapiClient
    .collection(name)
    .find(params)) as unknown as StrapiResponse<T>;
  return data;
}

// TODO: Implement this later
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getSingleType<T>(
  name: string,
  params: object,
): Promise<StrapiResponse<T>> {
  const data = (await strapiClient
    .single(name)
    .find(params)) as unknown as StrapiResponse<T>;
  return data;
}

/**
 * Fetches data from the Strapi API
 * @param path The API endpoint path
 * @param params Optional query parameters
 * @returns The JSON response from the API
 */
async function fetchFromStrapi<T>(
  collectionName: string,
  params?: object,
): Promise<StrapiResponse<T[]>> {
  console.log("Params from call: ", params);

  try {
    const data = await getCollectionType<T[]>(
      `${collectionName}s`,
      params || {},
    );
    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch failed")) {
      throw new Error(`Failed to connect to Strapi. Is the server running?`);
    }
    throw error;
  }
}

/**
 * Gets the pagination information from the Strapi response
 * @param response The Strapi response
 * @returns The pagination information
 */
function getPaginationInfo<
  T extends { meta?: { pagination?: { page: number; pageCount: number } } },
>(response: T) {
  return {
    currentPage: response.meta?.pagination?.page,
    totalPages: response.meta?.pagination?.pageCount,
  };
}

export { fetchFromStrapi, getPaginationInfo };
