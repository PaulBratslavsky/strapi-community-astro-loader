# Strapi Community Astro Loader

A community-driven Astro content loader for Strapi. Fetch content from a Strapi API and use it in your Astro project with full Content Layer support.

**v4** adds support for **Astro v6** and **Zod v4**.

## Requirements

- Astro v6+
- Strapi v5+
- Node.js 22+

## Installation

```bash
npm install strapi-community-astro-loader @strapi/client
```

## Usage

### Basic

```ts
import { defineCollection, z } from "astro:content";
import { strapiLoader } from "strapi-community-astro-loader";

const articles = defineCollection({
  loader: strapiLoader({
    contentType: "article",
    clientConfig: { baseURL: "http://localhost:1337/api" },
  }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    content: z.string().optional(),
  }),
});

export const collections = { articles };
```

### With Auth Token

```ts
const articles = defineCollection({
  loader: strapiLoader({
    contentType: "article",
    clientConfig: {
      baseURL: "http://localhost:1337/api",
      auth: process.env.STRAPI_TOKEN,
    },
  }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
  }),
});
```

### With Populate Params

Use the `params` option to control field population. This is passed directly to `@strapi/client`.

```ts
const articles = defineCollection({
  loader: strapiLoader({
    contentType: "article",
    clientConfig: { baseURL: "http://localhost:1337/api" },
    params: {
      populate: {
        featuredImage: { fields: ["url", "alternativeText"] },
        author: {
          populate: {
            image: { fields: ["url", "alternativeText"] },
          },
        },
      },
    },
  }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    featuredImage: z.object({
      url: z.string(),
      alternativeText: z.string().nullable(),
    }).optional(),
    author: z.object({
      fullName: z.string(),
      image: z.object({
        url: z.string(),
        alternativeText: z.string().nullable(),
      }).optional(),
    }).optional(),
  }),
});
```

### With Custom Plural Content Type

By default, the loader appends `s` to the `contentType` name. If your content type has a different plural form, specify it explicitly:

```ts
const categories = defineCollection({
  loader: strapiLoader({
    contentType: "category",
    pluralContentType: "categories",
    clientConfig: { baseURL: "http://localhost:1337/api" },
  }),
});
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `contentType` | `string` | **required** | The Strapi content type to query |
| `clientConfig` | `Config` | **required** | Config passed to `@strapi/client` (`baseURL`, `auth`) |
| `params` | `object` | `undefined` | Query params passed to Strapi (populate, filters, etc.) |
| `pluralContentType` | `string` | `${contentType}s` | Plural form of the content type name |
| `cacheDurationInMs` | `number` | `0` | How long to cache a sync (in ms). `0` = always fetch |
| `pageSize` | `number` | `25` | Number of items per page when paginating |

## Migrating from v2/v3

### Key changes

1. **Schema is no longer auto-inferred.** Define your own schema using `z` from `astro:content` in `defineCollection`.
2. **`strapiUrl` is replaced by `clientConfig`.** Pass `{ baseURL: "http://localhost:1337/api" }` instead.
3. **`syncInterval` is replaced by `cacheDurationInMs`.**
4. **No more bundled Zod.** The loader uses Astro's built-in Zod, which is Zod v4 in Astro v6.

### Before (v2)

```ts
const articles = defineCollection({
  loader: strapiLoader({ contentType: "article" }),
});
```

### After (v4)

```ts
const articles = defineCollection({
  loader: strapiLoader({
    contentType: "article",
    clientConfig: { baseURL: "http://localhost:1337/api" },
  }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
  }),
});
```

## License

MIT

For questions, contributions, and support, please open an issue on GitHub.
