/**
 * Utilities for handling DQL query variables
 */

/**
 * Variable info including name, type and value
 */
export interface DQLVariable {
  name: string;    // Variable name without $ prefix
  type?: string;   // Variable type if specified (e.g., 'int', 'string')
  value: string;   // The string value to use
}

/**
 * Detects variables in a DQL query
 * Variables in DQL can be used in different ways:
 * 1. Simple: just using $variableName
 * 2. Typed in query declaration: query myQuery($var: int) { ... }
 *
 * @param query The DQL query string
 * @returns Array of variable names without the $ prefix
 */
export function detectVariables(query: string): string[] {
  if (!query) return [];

  // First check for query declaration with typed variables
  const declaredVars = extractDeclaredVariables(query);

  // Then look for variables in the query body
  const regex = /\$([a-zA-Z][a-zA-Z0-9_]*)\b/g;
  const matches = query.match(regex) || [];

  // Combine both sets of variables (from declaration and body)
  const allVars = new Set([
    ...declaredVars.map(v => v.name),
    ...matches.map(m => m.substring(1))
  ]);

  return [...allVars];
}

/**
 * Extracts declared variables with their types
 * Looks for patterns like: query name($var1: type1, $var2: type2)
 *
 * @param query The DQL query
 * @returns Array of variable info objects
 */
export function extractDeclaredVariables(query: string): DQLVariable[] {
  if (!query) return [];

  // Match query declarations like "query name($var: type, $var2: type2)"
  const queryDeclMatch = query.match(/^\s*query\s+[\w]+\s*\((.+?)\)\s*\{/i);
  if (!queryDeclMatch || !queryDeclMatch[1]) return [];

  const varsDeclaration = queryDeclMatch[1];
  const varMatches = [...varsDeclaration.matchAll(/\$([\w]+)\s*:\s*([\w]+)/g)];

  return varMatches.map(match => ({
    name: match[1],
    type: match[2],
    value: '',
  }));
}

/**
 * Checks if a query is a named query with type declarations
 *
 * @param query The DQL query
 * @returns Whether the query has declared variables
 */
export function hasNamedQueryWithVars(query: string): boolean {
  if (!query) return false;
  return query.match(/^\s*query\s+[\w]+\s*\(.+?\)\s*\{/i) !== null;
}

/**
 * Validates that a variable has a valid value
 * 
 * @param name Variable name
 * @param value Variable value
 * @returns True if valid, false otherwise
 */
export function validateVariableValue(name: string, value: string): boolean {
  // For now, just check if the value is not empty
  return value.trim().length > 0;
}

/**
 * Formats a variable value for use in a DQL query
 * Dgraph may handle variable types differently based on how the query is structured
 *
 * @param value The variable value
 * @param type Optional variable type
 * @returns The formatted value
 */
export function formatVariableValue(value: string, type?: string): any {
  if (!type) {
    // If no type is specified, return the string value for backward compatibility
    return value;
  }
  
  // Format the value based on the declared type
  switch (type.toLowerCase()) {
    case 'int':
      return parseInt(value, 10);
    case 'float':
      return parseFloat(value);
    case 'bool':
    case 'boolean':
      return value.toLowerCase() === 'true';
    case 'string':
      return value;
    default:
      // For any other type, try to parse as JSON if it looks like JSON
      if ((value.startsWith('{') && value.endsWith('}')) ||
          (value.startsWith('[') && value.endsWith(']'))) {
        try {
          return JSON.parse(value);
        } catch (_) {
          // Fall back to string if parsing fails
        }
      }
      return value;
  }
}
