/**
 * Utilities for handling DQL query variables
 */

export interface DQLVariable {
  name: string;
  value: string;
  type?: string;
}

export interface VariableValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Parse variables from variable definitions
 */
export function parseVariables(variables: DQLVariable[]): Record<string, any> {
  const result: Record<string, any> = {};
  
  variables.forEach(variable => {
    if (variable.name && variable.value !== undefined) {
      // Convert value based on type
      if (variable.type === 'Int') {
        result[variable.name] = parseInt(variable.value, 10);
      } else if (variable.type === 'Float') {
        result[variable.name] = parseFloat(variable.value);
      } else if (variable.type === 'Boolean') {
        result[variable.name] = variable.value === 'true';
      } else {
        result[variable.name] = variable.value;
      }
    }
  });
  
  return result;
}

/**
 * Validate variable definitions
 */
export function validateVariables(variables: DQLVariable[]): VariableValidationResult {
  const errors: string[] = [];
  
  variables.forEach((variable, index) => {
    // Check for missing name
    if (!variable.name || variable.name.trim() === '') {
      errors.push(`Variable ${index + 1}: Missing variable name`);
    }
    
    // Check for invalid variable name
    if (variable.name && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(variable.name)) {
      errors.push(`Variable ${index + 1}: Invalid variable name '${variable.name}'`);
    }
    
    // Check for missing value
    if (variable.value === undefined || variable.value === null) {
      errors.push(`Variable ${index + 1}: Missing variable value`);
    }
    
    // Check type validation
    if (variable.type === 'Int' && isNaN(parseInt(variable.value, 10))) {
      errors.push(`Variable ${index + 1}: Value '${variable.value}' is not a valid integer`);
    }
    
    if (variable.type === 'Float' && isNaN(parseFloat(variable.value))) {
      errors.push(`Variable ${index + 1}: Value '${variable.value}' is not a valid float`);
    }
    
    if (variable.type === 'Boolean' && !['true', 'false'].includes(variable.value.toLowerCase())) {
      errors.push(`Variable ${index + 1}: Value '${variable.value}' is not a valid boolean`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Substitute variables in a query string
 */
export function substituteVariables(query: string, variables: Record<string, any>): string {
  let result = query;

  Object.entries(variables).forEach(([name, value]) => {
    const regex = new RegExp(`\\$${name}\\b`, 'g');

    if (typeof value === 'string') {
      // Escape quotes in string values
      const escapedValue = value.replace(/'/g, "\\'");
      result = result.replace(regex, `'${escapedValue}'`);
    } else {
      result = result.replace(regex, String(value));
    }
  });

  return result;
}

/**
 * Extract variable names from a query string
 */
export function extractVariableNames(query: string): string[] {
  const variableRegex = /\$([a-zA-Z_][a-zA-Z0-9_]*)/g;
  const variables: string[] = [];
  let match;

  while ((match = variableRegex.exec(query)) !== null) {
    const variableName = match[1];
    if (!variables.includes(variableName)) {
      variables.push(variableName);
    }
  }

  return variables;
}

/**
 * Detect variables in a query string (alias for extractVariableNames)
 */
export function detectVariables(query: string): string[] {
  return extractVariableNames(query);
}

/**
 * Format a variable value for display
 */
export function formatVariableValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
}

/**
 * Validate a single variable value
 */
export function validateVariableValue(name: string, value: string): boolean {
  if (!value || value.trim() === '') {
    return false;
  }

  // Basic validation - can be enhanced based on type
  return true;
}

/**
 * Extract declared variables from a named query
 */
export function extractDeclaredVariables(query: string): Array<{ name: string; type: string }> {
  const result: Array<{ name: string; type: string }> = [];

  // Look for variable declarations in named queries
  // This is a simplified implementation - can be enhanced for more complex parsing
  const varDeclRegex = /var\s+(\w+)\s*:\s*(\w+)/g;
  let match;

  while ((match = varDeclRegex.exec(query)) !== null) {
    result.push({
      name: match[1],
      type: match[2]
    });
  }

  return result;
}

/**
 * Check if a query is a named query with variable declarations
 */
export function hasNamedQueryWithVars(query: string): boolean {
  // Simple check for named query syntax
  return query.includes('query') && query.includes('var');
}
