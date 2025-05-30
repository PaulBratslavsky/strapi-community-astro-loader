import { z } from "zod";
import type { ZodTypeAny, ZodObject, ZodRawShape } from "zod";

type ZodComponentShape = ZodObject<{ __component: ZodTypeAny } & ZodRawShape>;

/**
 * Infers a Zod schema from a data object
 * Handles discriminated unions for component-based content
 */

export function inferSchemaFromResponse(
  data: unknown,
  fieldName?: string,
): ZodTypeAny {
  // Handle null/undefined
  if (data === null) return z.null();
  if (data === undefined) return z.undefined();

  // Handle arrays
  if (Array.isArray(data)) {
    // Special handling for arrays
    if (data.length === 0) {
      // Try to infer empty array type based on field name
      const inferredType = fieldName
        ? inferEmptyArrayTypeFromName(fieldName)
        : null;
      return inferredType || z.array(z.any());
    }

    // Handle arrays with components (dynamic zones)
    if (hasComponents(data)) {
      type ComponentGroup = Record<string, Array<Record<string, unknown>>>;

      // Group items by component type
      const componentGroups: ComponentGroup = data.reduce((acc, item) => {
        if (item && typeof item === "object" && "__component" in item) {
          const componentType = item.__component;
          if (!acc[componentType]) {
            acc[componentType] = [];
          }
          // Remove __component from the item to avoid schema conflicts
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { __component, ...rest } = item;
          acc[componentType].push(rest);
        }
        return acc;
      }, {} as ComponentGroup);

      // Only create discriminated union if we have valid component groups
      const validComponentGroups = Object.entries(componentGroups).filter(
        ([, items]) => items.length > 0,
      );

      if (validComponentGroups.length > 0) {
        try {
          // Create a discriminated union of component schemas
          const componentSchemas = validComponentGroups.map(
            ([componentType, items]) => {
              // Infer schema for this component type
              const componentSchema = inferSchemaFromResponse(items[0]);
              return z
                .object({
                  __component: z.literal(componentType),
                  id: z.number().optional(),
                })
                .merge(componentSchema as ZodObject<ZodRawShape>);
            },
          );

          // Ensure we have at least one schema
          if (componentSchemas.length === 0) {
            return z.array(z.any());
          }

          // Create the discriminated union
          return z.array(
            z.discriminatedUnion(
              "__component",
              componentSchemas as [ZodComponentShape, ...ZodComponentShape[]],
            ),
          );
        } catch (error) {
          console.warn("Failed to create component schema:", error);
          return z.array(z.any());
        }
      }
    }

    // For other arrays, infer based on first item
    return z.array(inferSchemaFromResponse(data[0]));
  }

  // Handle objects
  if (data && typeof data === "object") {
    const shape: Record<string, ZodTypeAny> = {};

    // Process each property recursively
    for (const [key, value] of Object.entries(data)) {
      // Pass field name context for better type inference
      shape[key] = inferSchemaFromResponse(value, key);
    }

    return z.object(shape);
  }

  // Handle primitive types
  return inferPrimitiveSchema(data);
}

/**
 * Tries to infer a schema for an empty array based on its field name
 * Uses naming conventions to guess the most likely content type
 */
function inferEmptyArrayTypeFromName(fieldName: string): ZodTypeAny | null {
  // Common field name patterns and their likely schemas
  const patterns: Array<{
    test: (name: string) => boolean;
    schema: ZodTypeAny;
  }> = [
    // Images, media, photos, etc.
    {
      test: (name) => /image|media|photo|picture|avatar|thumbnail/i.test(name),
      schema: z.array(
        z
          .object({
            id: z.number(),
            url: z.string(),
          })
          .passthrough(),
      ),
    },

    // Tags, categories, labels
    {
      test: (name) => /tag|category|label|topic/i.test(name),
      schema: z.array(
        z.union([
          z.string(),
          z.object({ id: z.number(), name: z.string() }).passthrough(),
        ]),
      ),
    },

    // IDs, references
    {
      test: (name) => /ids|references|keys/i.test(name),
      schema: z.array(z.union([z.string(), z.number()])),
    },

    // Comments, reviews
    {
      test: (name) => /comment|review|feedback/i.test(name),
      schema: z.array(
        z
          .object({
            id: z.number(),
            content: z.string(),
          })
          .passthrough(),
      ),
    },

    // Related items (very common in Strapi)
    {
      test: (name) => /related|linked|similar/i.test(name),
      schema: z.array(
        z
          .object({
            id: z.number(),
          })
          .passthrough(),
      ),
    },
  ];

  // Try to find a matching pattern
  for (const pattern of patterns) {
    if (pattern.test(fieldName)) {
      return pattern.schema;
    }
  }

  return null;
}

/**
 * Checks if array contains components with __component discriminator
 */
function hasComponents(data: unknown[]): boolean {
  return data.some(
    (item) => item && typeof item === "object" && "__component" in item,
  );
}

/**
 * Infers schema for primitive types
 */
function inferPrimitiveSchema(data: unknown): ZodTypeAny {
  if (typeof data === "string") {
    // Check if it looks like a date
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(data)) {
      return z.string().datetime();
    }

    // Check if it looks like a URL
    if (/^https?:\/\//i.test(data)) {
      return z.string().url();
    }

    // Check if it looks like an email
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data)) {
      return z.string().email();
    }

    return z.string();
  }

  if (typeof data === "number") return z.number();
  if (typeof data === "boolean") return z.boolean();

  // Fallback
  return z.any();
}
