# Strapi Community Astro Loader

**Update:** v2 for Strapi Community Astro Loader now available [here](https://github.com/PaulBratslavsky/strapi-community-astro-loader-v2)

I changed the implementation of how I infer types and no longer require the additional Strapi package, like in the first version of the loader. 


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

