/**
 * Utilities for handling DQL query variables
 */

/**
 * Detects variables in a DQL query
 * Variables in DQL are prefixed with $ (e.g., $name, $value)
 * 
 * @param query The DQL query string
 * @returns Array of variable names without the $ prefix
 */
export function detectVariables(query: string): string[] {
  if (!query) return [];
  
  // Match variables ($variableName) in the query
  // The regex matches $variableName but not inside comments or strings
  const regex = /\$([a-zA-Z][a-zA-Z0-9_]*)/g;
  
  const matches = query.match(regex);
  if (!matches) return [];
  
  // Remove duplicates and $ prefix
  return [...new Set(matches)].map(variable => variable.substring(1));
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
 * This is mainly for potential future enhancements like automatic type conversion
 * 
 * @param value The variable value
 * @returns The formatted value
 */
export function formatVariableValue(value: string): any {
  // Try to parse as JSON for objects and arrays
  try {
    // Check if the value looks like JSON
    if ((value.startsWith('{') && value.endsWith('}')) || 
        (value.startsWith('[') && value.endsWith(']'))) {
      return JSON.parse(value);
    }
  } catch (_) {
    // If parsing fails, treat as string
  }
  
  // Try to convert to number if it looks like one
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }
  
  // Handle boolean values
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  
  // Default to string
  return value;
}
