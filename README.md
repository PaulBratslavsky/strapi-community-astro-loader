# Strapi Community Astro Loader

This package is a community-driven Astro loader for Strapi. It allows you to fetch content from a Strapi API and use it in your Astro project. 

note: this is a work in progress and requires the use of the following package to be installed inside your Strapi project in order for it to work:

https://www.npmjs.com/package/get-strapi-schema


## Installation

```bash
npm install strapi-community-astro-loader
```

## Usage

``` ts
import { strapiLoader } from "strapi-community-astro-loader";

// pass the collection type name to the loader
const strapiPostsLoader = defineCollection({
  loader: strapiLoader({ contentType: "article" }),
});

```

## License

MIT

For questions, contributions, and support, please open an issue on GitHub.

