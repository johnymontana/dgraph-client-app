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
