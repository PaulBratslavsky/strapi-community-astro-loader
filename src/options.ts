import type { API, Config as StrapiClientConfig } from "@strapi/client";

export interface StrapiLoaderOptions {
  /**
   * The Strapi content type to query for this collection.
   */
  contentType: string;
  /**
   * Config to pass through to the strapi client.
   * @see @strapi/client
   */
  clientConfig: StrapiClientConfig;
  /**
   * The plural version of the content type name.
   * @defaultValue `${contentType}s`
   */
  pluralContentType?: string;
  /**
   * How long to cache a sync, in milliseconds.
   * @defaultValue 0
   */
  cacheDurationInMs?: number;
  /**
   * Parameters passed through to the strapi client.
   * Note: The `pagination` parameter is controlled by the loader to page through all content. Any pagination parameters given are ignored.
   * @see @strapi/client
   */
  params?: Omit<API.BaseQueryParams, "pagination">;
  /**
   * The size of each page to use as the loader pages through the content.
   * @defaultValue 25
   */
  pageSize?: number;
}
