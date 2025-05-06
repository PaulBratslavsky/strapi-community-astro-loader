import type { Config } from "@strapi/client";

const ABOUT_PAGE = {
  id: 6,
  documentId: "gny2yrqho5t9o4okxjqlpwqn",
  title: "About",
  description: "About page.",
  slug: "about",
  createdAt: "2025-03-05T19:13:40.938Z",
  updatedAt: "2025-04-26T20:18:50.480Z",
  publishedAt: "2025-04-26T20:18:50.488Z",
};

const COMPANY_PAGE = {
  id: 4,
  documentId: "dje64j42rlsry0p7lpnt87nb",
  title: "Our Company",
  description: "This will be page about our company.",
  slug: "our-company",
  createdAt: "2025-04-12T04:11:15.114Z",
  updatedAt: "2025-04-12T04:11:15.114Z",
  publishedAt: "2025-04-12T04:11:15.122Z",
};

export const PAGES = [COMPANY_PAGE, ABOUT_PAGE];

export const BASE_URL = "http://localhost:1337/api";

export const TYPE = "testType";

export const CLIENT_CONFIG: Config = {
  baseURL: BASE_URL,
};
