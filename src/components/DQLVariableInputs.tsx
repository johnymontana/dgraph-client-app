'use client';

import React, { useState, useEffect } from 'react';
import { detectVariables, formatVariableValue, validateVariableValue } from '@/utils/dqlVariables';

interface VariableData {
  name: string;
  value: string;
  isValid: boolean;
}

interface DQLVariableInputsProps {
  query: string;
  onChange: (variables: Record<string, any>) => void;
}

export default function DQLVariableInputs({ query, onChange }: DQLVariableInputsProps) {
  const [variables, setVariables] = useState<VariableData[]>([]);
  
  // Detect variables in the query whenever it changes
  useEffect(() => {
    const detectedVars = detectVariables(query);
    
    // Keep existing variable values if the variable is still present
    const newVariables = detectedVars.map(name => {
      const existingVar = variables.find(v => v.name === name);
      return {
        name,
        value: existingVar?.value || '',
        isValid: existingVar ? existingVar.isValid : false
      };
    });
    
    setVariables(newVariables);
    
    // Call onChange with the current variable values
    const varValues = buildVariablesObject(newVariables);
    onChange(varValues);
  }, [query]);
  
  // Build a variables object from the current state
  const buildVariablesObject = (vars: VariableData[]): Record<string, any> => {
    const result: Record<string, any> = {};
    vars.forEach(v => {
      if (v.value) {
        result[v.name] = formatVariableValue(v.value);
      }
    });
    return result;
  };
  
  // Handle variable value changes
  const handleVariableChange = (name: string, value: string) => {
    const updatedVariables = variables.map(v => {
      if (v.name === name) {
        return {
          ...v,
          value,
          isValid: validateVariableValue(name, value)
        };
      }
      return v;
    });
    
    setVariables(updatedVariables);
    
    // Notify parent component of the changes
    const varValues = buildVariablesObject(updatedVariables);
    onChange(varValues);
  };
  
  // Don't render if no variables are detected
  if (variables.length === 0) return null;
  
  return (
    <div className="mt-4 p-4 border border-indigo-200 bg-indigo-50 rounded-md">
      <h3 className="text-sm font-medium text-indigo-800 mb-2">Query Variables</h3>
      
      <div className="space-y-3">
        {variables.map(variable => (
          <div key={variable.name} className="flex items-start">
            <div className="w-1/4 pr-2">
              <label
                htmlFor={`var-${variable.name}`}
                className="block text-sm font-medium text-gray-700 mt-1"
              >
                ${variable.name}
              </label>
            </div>
            <div className="w-3/4">
              <input
                id={`var-${variable.name}`}
                type="text"
                value={variable.value}
                onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                placeholder="Enter value..."
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  variable.value && !variable.isValid
                    ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300'
                }`}
              />
              {variable.value && !variable.isValid && (
                <p className="mt-1 text-sm text-red-600">
                  Please enter a valid value for ${variable.name}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Values will be automatically converted to the appropriate type (string, number, boolean, object)
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
