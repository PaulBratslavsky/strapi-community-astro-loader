import { z } from "zod";
import type { ZodTypeAny, ZodObject } from "zod";

/**
 * Infers a Zod schema from a data object
 * Handles discriminated unions for component-based content
 */

export function inferSchemaFromResponse(data: any, fieldName?: string): ZodTypeAny {
  // Handle null/undefined
  if (data === null) return z.null();
  if (data === undefined) return z.undefined();
  
  // Handle arrays
  if (Array.isArray(data)) {
    // Special handling for arrays
    if (data.length === 0) {
      // Try to infer empty array type based on field name
      const inferredType = fieldName ? inferEmptyArrayTypeFromName(fieldName) : null;
      return inferredType || z.array(z.any());
    }
    
    // Handle arrays with components (dynamic zones)
    if (hasComponents(data)) {
      return z.array(
        z.object({
          __component: z.string(),
          id: z.number().optional(),
        }).passthrough()
      );
    }
    
    // For other arrays, infer based on first item
    return z.array(inferSchemaFromResponse(data[0]));
  }
  
  // Handle objects
  if (data && typeof data === 'object') {
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
    test: (name: string) => boolean,
    schema: ZodTypeAny
  }> = [
    // Images, media, photos, etc.
    {
      test: (name) => /image|media|photo|picture|avatar|thumbnail/i.test(name),
      schema: z.array(z.object({
        id: z.number(),
        url: z.string()
      }).passthrough())
    },
    
    // Tags, categories, labels
    {
      test: (name) => /tag|category|label|topic/i.test(name),
      schema: z.array(z.union([
        z.string(),
        z.object({ id: z.number(), name: z.string() }).passthrough()
      ]))
    },
    
    // IDs, references
    {
      test: (name) => /ids|references|keys/i.test(name),
      schema: z.array(z.union([z.string(), z.number()]))
    },
    
    // Comments, reviews
    {
      test: (name) => /comment|review|feedback/i.test(name),
      schema: z.array(z.object({
        id: z.number(),
        content: z.string()
      }).passthrough())
    },
    
    // Related items (very common in Strapi)
    {
      test: (name) => /related|linked|similar/i.test(name),
      schema: z.array(z.object({
        id: z.number()
      }).passthrough())
    }
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
function hasComponents(data: any[]): boolean {
  return data.some(item => 
    item && typeof item === 'object' && '__component' in item
  );
}

/**
 * Infers schema for primitive types
 */
function inferPrimitiveSchema(data: any): ZodTypeAny {
  if (typeof data === 'string') {
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
  
  if (typeof data === 'number') return z.number();
  if (typeof data === 'boolean') return z.boolean();
  
  // Fallback
  return z.any();
}
