// Ensure the required environment variable is set
function checkEnvironmentVariables(strapiUrl: string) {
  if (!strapiUrl) {
    throw new Error(
      "STRAPI_BASE_URL is not set. Please provide it as a parameter or set PUBLIC_STRAPI_URL in your environment."
    );
  }
}

export { checkEnvironmentVariables };