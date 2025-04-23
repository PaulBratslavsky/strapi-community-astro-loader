import qs from "qs";


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
    if (error instanceof TypeError && error.message.includes("fetch failed")) {
      throw new Error(
        `Failed to connect to Strapi at ${url.href}. Is the server running?`
      );
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
  T extends { meta?: { pagination?: { page: number; pageCount: number } } }
>(response: T) {
  return {
    currentPage: response.meta?.pagination?.page,
    totalPages: response.meta?.pagination?.pageCount,
  };
}


export { fetchFromStrapi, getPaginationInfo };