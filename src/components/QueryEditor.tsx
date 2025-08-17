'use client';

import React, { useState, useRef, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { useDgraph } from '@/context/DgraphContext';
import DQLAutocomplete from './DQLAutocomplete';
import QueryHistory, { QueryHistoryItem } from './QueryHistory';
import FullscreenToggle from './FullscreenToggle';
import DQLVariableInputs from './DQLVariableInputs';
import {
  Box,
  Card,
  Heading,
  Button,
  HStack,
  VStack,
  Text,
  Alert,
  Flex,
} from '@chakra-ui/react';
import { Icons } from '@/components/ui/icons';

interface QueryEditorProps {
  onQueryResult: (data: any) => void;
  initialQuery?: string;
  compact?: boolean;
}

type TabType = 'query' | 'mutation';

// Local storage key for query history
const QUERY_HISTORY_KEY = 'dgraph-client-query-history';

// Default query
const DEFAULT_QUERY = `{
  # Enter your DQL query here
  # Example:
  # q(func: has(name)) {
  #   uid
  #   name
  # }
}`;

// Default mutation
const DEFAULT_MUTATION = `{
  # Enter your DQL mutation here
  # Example:
  # set {
  #   _:person <name> "John Doe" .
  #   _:person <age> "30" .
  # }
}`;

export default function QueryEditor({ onQueryResult, initialQuery, compact = false }: QueryEditorProps) {
  // Ref for DQLAutocomplete's handleInput
  const autocompleteInputRef = useRef<(() => void) | null>(null);
  const { dgraphService, connected, parsedSchema } = useDgraph();
  const [activeTab, setActiveTab] = useState<TabType>('query');
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [mutation, setMutation] = useState(DEFAULT_MUTATION);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [queryVariables, setQueryVariables] = useState<Record<string, any>>({});
  const editorRef = useRef<HTMLDivElement>(null);

  // Load query history from localStorage on component mount
  useEffect(() => {
    const loadQueryHistory = () => {
      try {
        const savedHistory = localStorage.getItem(QUERY_HISTORY_KEY);
        if (savedHistory) {
          const parsedHistory = JSON.parse(savedHistory) as QueryHistoryItem[];
          setQueryHistory(parsedHistory);
        }
      } catch (err) {
        console.error('Failed to load query history:', err);
        // If there's an error loading history, reset it
        localStorage.removeItem(QUERY_HISTORY_KEY);
      }
    };

    loadQueryHistory();
  }, []);
  
  // Set initial query if provided
  useEffect(() => {
    if (initialQuery && initialQuery !== query) {
      setQuery(initialQuery);
    }
  }, [initialQuery, query]);

  // Handle cursor position changes
  const handleEditorChange = (value: string, viewUpdate: any) => {
    if (activeTab === 'query') {
      setQuery(value);
    } else {
      setMutation(value);
    }
    setCursorPosition(viewUpdate.state.selection.main.head);
    if (autocompleteInputRef.current) autocompleteInputRef.current();
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string) => {
    // Get the current word at cursor
    const currentText = activeTab === 'query' ? query : mutation;
    const beforeCursor = currentText.substring(0, cursorPosition);
    const afterCursor = currentText.substring(cursorPosition);
    const wordMatch = beforeCursor.match(/[\w]*$/);

    if (wordMatch) {
      // Replace the current word with the suggestion
      const wordStart = cursorPosition - wordMatch[0].length;
      const newText = currentText.substring(0, wordStart) + suggestion + afterCursor;
      if (activeTab === 'query') {
        setQuery(newText);
      } else {
        setMutation(newText);
      }

      // Update cursor position to end of inserted suggestion
      setCursorPosition(wordStart + suggestion.length);
    }
  };

  // Save query history to localStorage
  const saveQueryHistory = (history: QueryHistoryItem[]) => {
    try {
      localStorage.setItem(QUERY_HISTORY_KEY, JSON.stringify(history));
    } catch (err) {
      console.error('Failed to save query history:', err);
    }
  };

  // Add a query/mutation to history
  const addToHistory = (text: string, type: TabType = 'query') => {
    // Don't add empty or default queries/mutations to history
    if (!text.trim() ||
        (type === 'query' && text === DEFAULT_QUERY) ||
        (type === 'mutation' && text === DEFAULT_MUTATION)) return;

    // Create a new history item
    const newItem: QueryHistoryItem = {
      id: Date.now().toString(),
      query: text,
      timestamp: Date.now(),
      type: type,
    };

    // Add to history (most recent first) and limit to 50 items
    const updatedHistory = [newItem, ...queryHistory].slice(0, 50);
    setQueryHistory(updatedHistory);
    saveQueryHistory(updatedHistory);
  };

  // Clear all history
  const handleClearHistory = () => {
    setQueryHistory([]);
    localStorage.removeItem(QUERY_HISTORY_KEY);
  };

  // Delete a single query from history
  const handleDeleteQuery = (id: string) => {
    const updatedHistory = queryHistory.filter(item => item.id !== id);
    setQueryHistory(updatedHistory);
    saveQueryHistory(updatedHistory);
  };

  // Select a query from history
  const handleSelectQuery = (item: QueryHistoryItem) => {
    if (item.type === 'mutation') {
      setMutation(item.query);
      setActiveTab('mutation');
    } else {
      setQuery(item.query);
      setActiveTab('query');
    }
    setShowHistory(false);
  };

  // Handle variable changes from DQLVariableInputs component
  const handleVariablesChange = (variables: Record<string, any>) => {
    setQueryVariables(variables);
  };

  const handleRunOperation = async () => {
    if (!dgraphService || !connected) {
      setError('Not connected to Dgraph. Please connect first.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let result;
      const hasVariables = Object.keys(queryVariables).length > 0;
      if (activeTab === 'query') {
        // Pass variables if they exist
        result = await dgraphService.query(query, hasVariables ? queryVariables : undefined);
        // Add successful query to history
        addToHistory(query, 'query');
      } else {
        // Pass variables if they exist
        result = await dgraphService.mutate(mutation, hasVariables ? queryVariables : undefined);
        // Add successful mutation to history
        addToHistory(mutation, 'mutation');
      }

      onQueryResult(result);
    } catch (err: any) {
      console.error(`${activeTab === 'query' ? 'Query' : 'Mutation'} error:`, err);
      setError(err.response?.data?.errors?.[0]?.message || err.message || `Failed to execute ${activeTab}`);
      onQueryResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card.Root variant="elevated" h="full">
      {/* Header */}
      <Box p={4} borderBottom="1px" borderColor="border.primary">
        <Flex justify="space-between" align="center" gap={4}>
          <VStack align="start" gap={1} flex={1} minW={0}>
            <Heading textStyle="heading.card">
              DQL Editor
            </Heading>
            <Text textStyle="body.small">
              Write and execute DQL queries and mutations
            </Text>
          </VStack>
          
          <HStack gap={2} flexShrink={0}>
            {!compact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                gap={2}
              >
                <Icons.history size={16} />
                <Text>History</Text>
              </Button>
            )}
            
            <Button
              onClick={handleRunOperation}
              loading={isLoading}
              loadingText="Running..."
              disabled={!connected}
              colorPalette="blue"
              size="sm"
              gap={2}
              borderRadius="lg"
            >
              <Icons.play size={16} />
              <Text>{`Run ${activeTab === 'query' ? 'Query' : 'Mutation'}`}</Text>
            </Button>
            
            {!compact && (
              <FullscreenToggle
                isFullscreen={isFullscreen}
                onToggle={() => setIsFullscreen(!isFullscreen)}
              />
            )}
          </HStack>
        </Flex>
      </Box>

      {/* Tabs */}
      <HStack borderBottom="1px" borderColor="border.primary" gap={0} px={4}>
        <Button
          onClick={() => setActiveTab('query')}
          variant="ghost"
          size="sm"
          color={activeTab === 'query' ? 'accent.primary' : 'fg.secondary'}
          borderBottom="2px"
          borderColor={activeTab === 'query' ? 'accent.primary' : 'transparent'}
          borderRadius="0"
          _hover={{ 
            bg: 'transparent',
            color: activeTab === 'query' ? 'accent.primary' : 'fg.primary'
          }}
          px={4}
          py={3}
          fontWeight="semibold"
          gap={2}
        >
          <Icons.database size={14} />
          <Text>Query</Text>
        </Button>
        <Button
          onClick={() => setActiveTab('mutation')}
          variant="ghost"
          size="sm"
          color={activeTab === 'mutation' ? 'accent.primary' : 'fg.secondary'}
          borderBottom="2px"
          borderColor={activeTab === 'mutation' ? 'accent.primary' : 'transparent'}
          borderRadius="0"
          _hover={{ 
            bg: 'transparent',
            color: activeTab === 'mutation' ? 'accent.primary' : 'fg.primary'
          }}
          px={4}
          py={3}
          fontWeight="semibold"
          gap={2}
        >
          <Icons.settings size={14} />
          <Text>Mutation</Text>
        </Button>
      </HStack>

      {error && (
        <Box p={4}>
          <Alert.Root status="error" variant="subtle" borderRadius="lg">
            <Alert.Indicator />
            <Alert.Content>
              <Text textStyle="body.medium">{error}</Text>
            </Alert.Content>
          </Alert.Root>
        </Box>
      )}


      {showHistory && !compact && (
        <Box p={4} borderBottom="1px" borderColor="border.secondary">
          <QueryHistory
            history={queryHistory}
            onSelectQuery={handleSelectQuery}
            onClearHistory={handleClearHistory}
            onDeleteQuery={handleDeleteQuery}
          />
        </Box>
      )}

      <Box position="relative" flex={1} p={4}>
        <Box
          layerStyle="code-editor"
          overflow="hidden"
          h={compact ? '150px' : (isFullscreen ? 'calc(100vh - 280px)' : 'calc(100% - 80px)')}
        >
          <CodeMirror
            value={activeTab === 'query' ? query : mutation}
            height="100%"
            onChange={handleEditorChange}
            theme="light"
            className="text-sm"
          />
        </Box>

        {/* Variable inputs */}
        <DQLVariableInputs
          query={activeTab === 'query' ? query : mutation}
          onChange={handleVariablesChange}
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
          <DQLAutocomplete
            editorRef={editorRef}
            query={query}
            cursorPosition={cursorPosition}
            schema={parsedSchema}
            onSuggestionSelect={handleSuggestionSelect}
            registerHandleInput={(handle: () => void) => {
              autocompleteInputRef.current = handle;
            }}
          />
        </Box>
      </Box>

      {/* Footer with help text */}
      <Box p={4} borderTop="1px" borderColor="border.secondary" bg="bg.muted">
        <VStack gap={2} align="start">
          <Text textStyle="body.small">
            Enter a DQL query to execute against your Dgraph database.
          </Text>
          <Text textStyle="helper">
            Example: <Box as="code" textStyle="code.inline">{`{ q(func: has(name)) { uid name } }`}</Box>
          </Text>
        </VStack>
      </Box>
    </Card.Root>
  );
}
