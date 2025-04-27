import { strapi } from "@strapi/client";
import { checkEnvironmentVariables } from "./check-environment-variables";

const STRAPI_BASE_URL =
  (import.meta as unknown as ImportMeta).env.STRAPI_BASE_URL ||
  "http://localhost:1337";
  
const strapiClient = strapi({ baseURL: STRAPI_BASE_URL + "/api" });

checkEnvironmentVariables(STRAPI_BASE_URL);


export { strapiClient };