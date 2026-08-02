import { createSwaggerSpec } from "next-swagger-doc";

// Generates the OpenAPI spec from @swagger JSDoc blocks across the ENTIRE app/api tree
// (every route.js/route.ts under app/api, not just app/api/v1). `servers` is the site root,
// so every @swagger `path:` in every route file must be written as the FULL path starting
// with /api/... (e.g. /api/v1/products/search, /api/auth/logout), not a path relative to /api/v1.
export const getApiDocs = () =>
  createSwaggerSpec({
    apiFolder: "app/api",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Garg Dental E-Commerce API",
        version: "1.0.0",
        description:
          "Official API reference for the Garg Dental e-commerce platform, covering the web storefront, admin panel, and mobile app integrations.",
      },
      servers: [{ url: "/" }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
  });

// Distinct @swagger tag names used across app/api, sorted for a stable dropdown order.
export const getApiTags = () => {
  const { paths } = getApiDocs();
  const tags = new Set();

  for (const pathItem of Object.values(paths ?? {})) {
    for (const operation of Object.values(pathItem)) {
      for (const tag of operation?.tags ?? []) {
        tags.add(tag);
      }
    }
  }

  return [...tags].sort();
};

// Full spec with `paths` narrowed to only the operations carrying `tag`, so the
// docs UI can offer a per-tag "definition" instead of always dumping the entire API.
export const getApiDocsByTag = (tag) => {
  const spec = getApiDocs();
  const filteredPaths = {};

  for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
    const filteredPathItem = Object.fromEntries(
      Object.entries(pathItem).filter(([, operation]) =>
        operation?.tags?.includes(tag)
      )
    );
    if (Object.keys(filteredPathItem).length > 0) {
      filteredPaths[path] = filteredPathItem;
    }
  }

  return { ...spec, paths: filteredPaths };
};
