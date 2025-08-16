'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Field,
  Input,
  Text,
} from '@chakra-ui/react';
import { useColorModeValue } from '@/components/ui/color-mode';
import {
  detectVariables,
  formatVariableValue,
  validateVariableValue,
  extractDeclaredVariables,
  hasNamedQueryWithVars,
  DQLVariable
} from '@/utils/dqlVariables';

interface VariableData {
  name: string;
  type?: string;
  value: string;
  isValid: boolean;
}

interface DQLVariableInputsProps {
  query: string;
  onChange: (variables: Record<string, any>) => void;
}

export default function DQLVariableInputs({ query, onChange }: DQLVariableInputsProps) {
  const [variables, setVariables] = useState<VariableData[]>([]);

  // Color mode values
  const bgColor = useColorModeValue('blue.50', 'blue.900');
  const borderColor = useColorModeValue('blue.200', 'blue.700');
  const textColor = useColorModeValue('blue.800', 'blue.200');
  const labelColor = useColorModeValue('gray.700', 'gray.300');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.400');
  const errorTextColor = useColorModeValue('red.600', 'red.400');
  
  // Detect variables in the query whenever it changes
  useEffect(() => {
    // Check if this is a named query with declared variable types
    const isNamedQuery = hasNamedQueryWithVars(query);
    let newVariables: VariableData[] = [];
    
    if (isNamedQuery) {
      // For named queries, extract the variables with their types
      const declaredVars = extractDeclaredVariables(query);
      newVariables = declaredVars.map(dv => {
        const existingVar = variables.find(v => v.name === dv.name);
        return {
          name: dv.name,
          type: dv.type,
          value: existingVar?.value || '',
          isValid: existingVar ? existingVar.isValid : false
        };
      });
    } else {
      // For simple queries, just get the variable names
      const detectedVars = detectVariables(query);
      newVariables = detectedVars.map(name => {
        const existingVar = variables.find(v => v.name === name);
        return {
          name,
          value: existingVar?.value || '',
          isValid: existingVar ? existingVar.isValid : false
        };
      });
    }
    
    setVariables(newVariables);
    
    // Call onChange with the current variable values
    const varValues = buildVariablesObject(newVariables);
    onChange(varValues);
  }, [query]);
  
  // Build a variables object from the current state
  const buildVariablesObject = (vars: VariableData[]): Record<string, string> => {
    const result: Record<string, string> = {};
    vars.forEach(v => {
      if (v.value) {
        // Include the $ prefix in the variable name and ensure value is a string
        result[`$${v.name}`] = String(v.value);
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
    <Box mt={4} p={4} border="1px" borderColor={borderColor} bg={bgColor} borderRadius="md">
      <Heading as="h3" size="sm" color={textColor} mb={2}>
        Query Variables
      </Heading>
      
      <VStack gap={3} align="stretch">
        {variables.map(variable => (
          <HStack key={variable.name} align="start" gap={4}>
            <Box w="1/4">
              <Field.Label
                htmlFor={`var-${variable.name}`}
                fontSize="sm"
                fontWeight="medium"
                color={labelColor}
                mt={1}
                display="block"
              >
                ${variable.name}{variable.type ? `: ${variable.type}` : ''}
              </Field.Label>
            </Box>
            <Box w="3/4">
              <Field.Root>
                <Input
                  id={`var-${variable.name}`}
                  type="text"
                  value={variable.value}
                  onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                  placeholder="Enter value..."
                  size="sm"
                  variant="outline"
                  borderColor={variable.value && !variable.isValid ? 'red.300' : 'gray.300'}
                  _focus={{
                    ring: 2,
                    ringColor: variable.value && !variable.isValid ? 'red.500' : 'blue.500',
                    borderColor: variable.value && !variable.isValid ? 'red.500' : 'blue.500'
                  }}
                />
                {variable.value && !variable.isValid && (
                  <Field.HelperText color={errorTextColor}>
                    Please enter a valid value for ${variable.name}
                  </Field.HelperText>
                )}
                <Field.HelperText fontSize="xs" color={mutedTextColor}>
                  Values will be automatically converted to the appropriate type (string, number, boolean, object)
                </Field.HelperText>
              </Field.Root>
            </Box>
          </HStack>
        ))}
      </VStack>
    </Box>
  );
}
