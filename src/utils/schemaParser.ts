/**
 * Utility functions for parsing Dgraph schema and generating autocomplete suggestions
 */

export interface SchemaItem {
  predicate: string;
  type: string;
  index?: string;
  upsert?: boolean;
  lang?: boolean;
  reverse?: boolean;
  isArray?: boolean;
}

export interface ParsedSchema {
  predicates: SchemaItem[];
  types: string[];
}

/**
 * Parse raw schema text into structured schema items
 */
export function parseSchema(schemaText: string): ParsedSchema {
  const predicates: SchemaItem[] = [];
  const types = new Set<string>(['string', 'int', 'float', 'bool', 'datetime', 'geo', 'uid']);
  
  // Handle empty schema
  if (!schemaText || schemaText.trim().startsWith('#')) {
    return { predicates, types: Array.from(types) };
  }
  
  // Split schema text by lines and process each line
  const lines = schemaText.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip comments and empty lines
    if (trimmedLine.startsWith('#') || !trimmedLine) {
      continue;
    }
    
    // Parse schema line
    const schemaItem = parseSchemaLine(trimmedLine);
    if (schemaItem) {
      predicates.push(schemaItem);
      types.add(schemaItem.type);
    }
  }
  
  return {
    predicates,
    types: Array.from(types)
  };
}

/**
 * Parse a single schema line into a SchemaItem
 */
function parseSchemaLine(line: string): SchemaItem | null {
  // Basic regex to match schema definition
  // Format: <predicate>: <type> [@index(...)] [@upsert] [@lang] [@reverse] .
  const schemaRegex = /^([a-zA-Z0-9._-]+)\s*:\s*(\[?[a-zA-Z0-9]+\]?)\s*(?:@index\(([^)]+)\))?\s*(@upsert)?\s*(@lang)?\s*(@reverse)?\s*\.?$/;
  
  const match = line.match(schemaRegex);
  if (!match) return null;
  
  const [, predicate, type, index, upsert, lang, reverse] = match;
  
  // Check if type is an array (e.g., [uid])
  const isArray = type.startsWith('[') && type.endsWith(']');
  const cleanType = isArray ? type.slice(1, -1) : type;
  
  return {
    predicate,
    type: cleanType,
    index: index || undefined,
    upsert: !!upsert,
    lang: !!lang,
    reverse: !!reverse,
    isArray
  };
}

/**
 * Generate DQL function suggestions based on schema
 */
export function getDqlFunctionSuggestions(): string[] {
  return [
    'eq', 'lt', 'le', 'gt', 'ge', 'has', 'allof', 'anyof',
    'allofterms', 'anyofterms', 'regexp', 'near', 'within',
    'contains', 'intersects', 'uid', 'uid_in', 'type'
  ];
}

/**
 * Generate DQL directive suggestions
 */
export function getDqlDirectiveSuggestions(): string[] {
  return [
    '@filter', '@facets', '@cascade', '@normalize', '@groupby',
    '@ignorereflex', '@recurse', '@lambda'
  ];
}

/**
 * Generate autocomplete suggestions based on schema and query context
 */
export function generateSuggestions(
  schema: ParsedSchema,
  word: string,
  context: 'function' | 'predicate' | 'directive' | 'type' | 'unknown' = 'unknown'
): string[] {
  const suggestions: string[] = [];
  
  switch (context) {
    case 'function':
      // Suggest DQL functions
      suggestions.push(...getDqlFunctionSuggestions().filter(f => f.startsWith(word)));
      break;
      
    case 'predicate':
      // Suggest predicates from schema
      suggestions.push(...schema.predicates.map(p => p.predicate).filter(p => p.startsWith(word)));
      break;
      
    case 'directive':
      // Suggest DQL directives
      suggestions.push(...getDqlDirectiveSuggestions().filter(d => d.startsWith(word)));
      break;
      
    case 'type':
      // Suggest types from schema
      suggestions.push(...schema.types.filter(t => t.startsWith(word)));
      break;
      
    default:
      // Unknown context, suggest everything
      suggestions.push(
        ...getDqlFunctionSuggestions().filter(f => f.startsWith(word)),
        ...schema.predicates.map(p => p.predicate).filter(p => p.startsWith(word)),
        ...getDqlDirectiveSuggestions().filter(d => d.startsWith(word))
      );
      break;
  }
  
  return suggestions;
}

/**
 * Determine the context of the cursor position in the query
 */
export function determineContext(
  query: string,
  cursorPos: number
): 'function' | 'predicate' | 'directive' | 'type' | 'unknown' {
  const textBeforeCursor = query.slice(0, cursorPos);
  
  // Check if we're in a function context
  if (/\(\s*func\s*:\s*$/.test(textBeforeCursor)) {
    return 'function';
  }
  
  // Check if we're in a directive context
  if (/\s+@\w*$/.test(textBeforeCursor)) {
    return 'directive';
  }
  
  // Check if we're in a predicate context (inside curly braces)
  const lastOpenBrace = textBeforeCursor.lastIndexOf('{');
  const lastCloseBrace = textBeforeCursor.lastIndexOf('}');
  
  if (lastOpenBrace > lastCloseBrace) {
    return 'predicate';
  }
  
  // Default to unknown context
  return 'unknown';
}
