/**
 * Utility functions for parsing Dgraph schema and generating autocomplete suggestions
 */

export interface SchemaType {
  name: string;
  fields: SchemaField[];
}

export interface SchemaField {
  name: string;
  type: string;
  kind?: string;
}

export interface ParsedSchema {
  types: SchemaType[];
}

export interface SchemaValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface SchemaSuggestion {
  label: string;
  type: 'type' | 'field';
  description?: string;
}

/**
 * Parse schema from different formats (Dgraph, GraphQL)
 */
export function parseSchema(schema: any): ParsedSchema {
  if (!schema) {
    return { types: [] };
  }

  // Handle Dgraph schema format
  if (schema.schema && Array.isArray(schema.schema)) {
    return parseDgraphSchema(schema);
  }

  // Handle GraphQL schema format
  if (schema.data && schema.data.__schema && schema.data.__schema.types) {
    return parseGraphQLSchema(schema);
  }

  return { types: [] };
}

/**
 * Parse Dgraph schema format
 */
function parseDgraphSchema(schema: any): ParsedSchema {
  const types = new Map<string, SchemaType>();
  
  schema.schema.forEach((predicate: any) => {
    if (predicate.predicate && predicate.type) {
      // Extract type name from predicate
      const typeName = extractTypeNameFromPredicate(predicate.predicate);
      
      if (!types.has(typeName)) {
        types.set(typeName, {
          name: typeName,
          fields: []
        });
      }
      
      const type = types.get(typeName)!;
      type.fields.push({
        name: predicate.predicate,
        type: predicate.type
      });
    }
  });
  
  return { types: Array.from(types.values()) };
}

/**
 * Parse GraphQL schema format
 */
function parseGraphQLSchema(schema: any): ParsedSchema {
  const types: SchemaType[] = [];
  
  schema.data.__schema.types.forEach((type: any) => {
    if (type.name && type.fields && Array.isArray(type.fields)) {
      types.push({
        name: type.name,
        fields: type.fields.map((field: any) => ({
          name: field.name,
          type: field.type?.name || 'Unknown',
          kind: field.kind
        }))
      });
    }
  });
  
  return { types };
}

/**
 * Extract type name from predicate
 */
function extractTypeNameFromPredicate(predicate: string): string {
  // Simple heuristic: use the first part of the predicate as type name
  const parts = predicate.split('.');
  return parts[0] || 'Unknown';
}

/**
 * Extract types from schema
 */
export function extractTypes(schema: any): SchemaType[] {
  const parsed = parseSchema(schema);
  return parsed.types;
}

/**
 * Extract fields from schema
 */
export function extractFields(schema: any): SchemaField[] {
  const types = extractTypes(schema);
  const fields: SchemaField[] = [];
  
  types.forEach(type => {
    type.fields.forEach(field => {
      fields.push({
        name: field.name,
        type: field.type,
        kind: field.kind
      });
    });
  });
  
  return fields;
}

/**
 * Validate schema structure
 */
export function validateSchema(schema: any): SchemaValidationResult {
  const errors: string[] = [];
  
  if (!schema) {
    errors.push('Schema is required');
    return { isValid: false, errors };
  }
  
  // Check for Dgraph schema format
  if (schema.schema) {
    if (!Array.isArray(schema.schema)) {
      errors.push('Dgraph schema must have an array of predicates');
    } else {
      schema.schema.forEach((predicate: any, index: number) => {
        if (!predicate.predicate) {
          errors.push(`Predicate ${index + 1}: Missing predicate name`);
        }
        if (!predicate.type) {
          errors.push(`Predicate ${index + 1}: Missing predicate type`);
        }
      });
    }
  }
  
  // Check for GraphQL schema format
  if (schema.data && schema.data.__schema) {
    if (!schema.data.__schema.types || !Array.isArray(schema.data.__schema.types)) {
      errors.push('GraphQL schema must have an array of types');
    }
  }
  
  // If neither format is detected
  if (!schema.schema && (!schema.data || !schema.data.__schema)) {
    errors.push('Schema must be in Dgraph or GraphQL format');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get schema suggestions based on input
 */
export function getSchemaSuggestions(input: string, schema: any): SchemaSuggestion[] {
  const suggestions: SchemaSuggestion[] = [];
  
  if (!schema) {
    return suggestions;
  }
  
  const types = extractTypes(schema);
  const fields = extractFields(schema);
  
  // Add type suggestions
  types.forEach(type => {
    if (type.name.toLowerCase().includes(input.toLowerCase())) {
      suggestions.push({
        label: type.name,
        type: 'type',
        description: `Type: ${type.name}`
      });
    }
  });
  
  // Add field suggestions
  fields.forEach(field => {
    if (field.name.toLowerCase().includes(input.toLowerCase())) {
      suggestions.push({
        label: field.name,
        type: 'field',
        description: `Field: ${field.name} (${field.type})`
      });
    }
  });
  
  return suggestions;
}
