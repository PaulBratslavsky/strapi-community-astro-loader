# Strapi Community Astro Loader

**Update:** v2 for Strapi Community Astro Loader now is here.

I changed the implementation of how I infer types and no longer require the additional Strapi package, like in the first version of the loader.

This package is a community-driven Astro loader for Strapi. It allows you to fetch content from a Strapi API and use it in your Astro project.

note: this is a work in progress

## Installation

```bash
npm install strapi-community-astro-loader
```

## Usage

```ts
import { strapiLoader } from "strapi-community-astro-loader";

// pass the collection type name to the loader
const strapiPostsLoader = defineCollection({
  loader: strapiLoader({ contentType: "article" }),
});
```

You can now pass populate options to the loader. Using the params object you can pass populate options to the loader.

```ts
const strapiPostsLoader = defineCollection({
  loader: strapiLoader({ contentType: "articles", params: { populate: "*" } }),
});
```

## License

MIT

For questions, contributions, and support, please open an issue on GitHub.
