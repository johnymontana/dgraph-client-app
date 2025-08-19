'use client';

import React, { useState, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { useDgraph } from '@/context/DgraphContext';
import SchemaAutocomplete from './SchemaAutocomplete';
import SchemaVisualization from './SchemaVisualization';
import {
  Box,
  Card,
  Heading,
  Button,
  Text,
  Alert,
  HStack,
  VStack,
  Code,
} from '@chakra-ui/react';
import { useColorModeValue } from '@/components/ui/color-mode';

export default function SchemaEditor() {
  // Ref for SchemaAutocomplete's handleInput
  const autocompleteInputRef = useRef<(() => void) | null>(null);
  const { dgraphService, connected, schemaText, updateSchemaText } = useDgraph();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const editorRef = useRef<HTMLDivElement>(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.300', 'gray.600');
  const textColor = useColorModeValue('gray.900', 'white');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.400');

  // Handle cursor position changes
  const handleEditorChange = (value: string, viewUpdate: any) => {
    updateSchemaText(value);
    setCursorPosition(viewUpdate.state.selection.main.head);
    if (autocompleteInputRef.current) autocompleteInputRef.current();
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string) => {
    // Get the current word at cursor
    const beforeCursor = schemaText.substring(0, cursorPosition);
    const afterCursor = schemaText.substring(cursorPosition);
    const wordMatch = beforeCursor.match(/[\w]*$/);

    if (wordMatch) {
      // Replace the current word with the suggestion
      const wordStart = cursorPosition - wordMatch[0].length;
      const newSchema = schemaText.substring(0, wordStart) + suggestion + afterCursor;
      updateSchemaText(newSchema);
      // Update cursor position to end of inserted suggestion
      setCursorPosition(wordStart + suggestion.length);
    }
  };

  useEffect(() => {
    if (connected && dgraphService && !schemaText) {
      fetchSchema();
    }
  }, [connected, dgraphService, schemaText]);

  const fetchSchema = async () => {
    if (!dgraphService || !connected) {
      setError('Not connected to Dgraph. Please connect first.');
      return;
    }

    setIsFetching(true);
    setError(null);

    try {
      const result = await dgraphService.getSchema();
      console.log('Raw schema result from Dgraph:', result);

      if (result && result.data && result.data.schema) {
        console.log('Schema data items:', result.data.schema);

        const schemaText = result.data.schema.map((item: any) => {
          return `${item.predicate}: ${item.type} ${item.index ? '@index(' + item.index + ')' : ''} ${item.upsert ? '@upsert' : ''} ${item.lang ? '@lang' : ''} ${item.reverse ? '@reverse' : ''} .`;
        }).join('\n');

        console.log('Formatted schema text:', schemaText);
        updateSchemaText(schemaText);
      } else {
        console.log('No schema data found in result');
        updateSchemaText('# No schema found or empty schema');
      }
    } catch (err: any) {
      console.error('Schema fetch error:', err);
      setError(err.response?.data?.errors?.[0]?.message || err.message || 'Failed to fetch schema');
    } finally {
      setIsFetching(false);
    }
  };

  const handleUpdateSchema = async () => {
    if (!dgraphService || !connected) {
      setError('Not connected to Dgraph. Please connect first.');
      return;
    }

    if (!schemaText || schemaText.trim() === '') {
      setError('Schema text cannot be empty.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Update the schema
      await dgraphService.alter(schemaText);
      setSuccess('Schema updated successfully!');
      
      // Refresh the schema to show the updated version
      setTimeout(() => {
        fetchSchema();
      }, 1000);
    } catch (err: any) {
      console.error('Schema update error:', err);
      setError(err.response?.data?.errors?.[0]?.message || err.message || 'Failed to update schema');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card.Root bg={bgColor} shadow="lg" p={6}>
      <VStack gap={6} align="stretch">
        <HStack justify="space-between" align="center">
          <Heading as="h2" size="md" color={textColor}>
            DQL Schema
          </Heading>
          <HStack gap={2}>
            <Button
              onClick={fetchSchema}
              loading={isFetching}
              loadingText="Fetching..."
              disabled={!connected}
              colorPalette="gray"
              size="md"
            >
              Refresh Schema
            </Button>
            <Button
              onClick={handleUpdateSchema}
              loading={isLoading}
              loadingText="Updating..."
              disabled={!connected}
              className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Update Schema
            </Button>
          </HStack>
        </HStack>

        {error && (
          <Alert.Root status="error" mb={4}>
            <Alert.Indicator />
            <Alert.Content>
              {error}
            </Alert.Content>
          </Alert.Root>
        )}

        {success && (
          <Alert.Root status="success" mb={4}>
            <Alert.Indicator />
            <Alert.Content>
              {success}
            </Alert.Content>
          </Alert.Root>
        )}

        {/* Side-by-side layout */}
        <Box
          display="flex"
          gap={6}
          h="calc(100vh - 280px)"
          minH="600px"
        >
          {/* Left side - Schema Editor */}
          <Box flex="1" minW="0">
            <VStack gap={4} align="stretch" h="full">
              <Box
                position="relative"
                border="1px"
                borderColor={borderColor}
                borderRadius="md"
                overflow="hidden"
                flex="1"
                minH="0"
              >
                <CodeMirror
                  value={schemaText}
                  height="100%"
                  onChange={handleEditorChange}
                  theme="light"
                  className="text-sm"
                />
                <Box
                  ref={editorRef}
                  tabIndex={0}
                  onKeyDown={() => {
                    if (autocompleteInputRef.current) autocompleteInputRef.current();
                  }}
                  onInput={() => {
                    if (autocompleteInputRef.current) autocompleteInputRef.current();
                  }}
                >
                  <SchemaAutocomplete
                    editorRef={editorRef}
                    schema={schemaText}
                    cursorPosition={cursorPosition}
                    onSuggestionSelect={handleSuggestionSelect}
                    registerHandleInput={(handle: () => void) => {
                      autocompleteInputRef.current = handle;
                    }}
                  />
                </Box>
              </Box>

              <VStack gap={2} align="start">
                <Text fontSize="sm" color={mutedTextColor}>
                  Edit the DQL schema above and click "Update Schema" to apply changes.
                </Text>
                <Text fontSize="sm" color={mutedTextColor}>
                  Example: <Code>name: string @index(exact) .</Code>
                </Text>
              </VStack>
            </VStack>
          </Box>

          {/* Right side - Schema Visualization */}
          <Box flex="1" minW="0">
            {schemaText && schemaText.trim() !== '' && schemaText !== '# No schema found or empty schema' ? (
              <Box h="full">
                <SchemaVisualization schemaText={schemaText} />
              </Box>
            ) : (
              <Box
                h="full"
                border="1px"
                borderColor={borderColor}
                borderRadius="md"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg="bg.muted"
              >
                <VStack gap={2} align="center">
                  <Text color={mutedTextColor} textAlign="center">
                    Schema visualization will appear here
                  </Text>
                  <Text fontSize="sm" color={mutedTextColor} textAlign="center">
                    Edit the schema on the left to see the visualization
                  </Text>
                </VStack>
              </Box>
            )}
          </Box>
        </Box>
      </VStack>
    </Card.Root>
  );
}
