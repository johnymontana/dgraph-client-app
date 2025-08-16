'use client';

import React, { useState, useRef, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { useDgraph } from '@/context/DgraphContext';
import DQLAutocomplete from './DQLAutocomplete';
import QueryHistory, { QueryHistoryItem } from './QueryHistory';
import FullscreenToggle from './FullscreenToggle';
import GuidedExperience from './GuidedExperience';
import DQLVariableInputs from './DQLVariableInputs';
import { GuideMetadata } from '@/utils/mdxLoader';
import axios from 'axios';
import {
  Box,
  Card,
  Heading,
  Button,
  HStack,
  VStack,
  Text,
  Alert,
} from '@chakra-ui/react';

interface QueryEditorProps {
  onQueryResult: (data: any) => void;
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

export default function QueryEditor({ onQueryResult }: QueryEditorProps) {
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
  const [showGuide, setShowGuide] = useState(false);
  const [guides, setGuides] = useState<{ content: string; metadata: GuideMetadata }[]>([]);
  const [guidesLoading, setGuidesLoading] = useState(false);
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
  
  // Load guides when guided experience is toggled on
  useEffect(() => {
    if (showGuide && guides.length === 0 && !guidesLoading) {
      setGuidesLoading(true);

      const fetchGuides = async () => {
        try {
          // First get all guide metadata
          const metadataResponse = await axios.get('/api/guides');
          const guidesMetadata = metadataResponse.data as GuideMetadata[];

          // Then fetch content for each guide
          const guidesWithContent = await Promise.all(
            guidesMetadata.map(async (metadata) => {
              const guideResponse = await axios.get(`/api/guides?slug=${metadata.slug}`);
              return guideResponse.data;
            })
          );

          setGuides(guidesWithContent);
        } catch (error) {
          console.error('Error loading guides:', error);
          setError('Failed to load tutorial guides');
        } finally {
          setGuidesLoading(false);
        }
      };

      fetchGuides();
    }
  }, [showGuide, guides.length, guidesLoading]);

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
    <Card.Root
      variant="elevated"
      p={6}
      mb={!isFullscreen ? 6 : 0}
      position={isFullscreen ? 'absolute' : 'relative'}
      inset={isFullscreen ? 0 : 'auto'}
      zIndex={isFullscreen ? 50 : 'auto'}
    >
      <VStack gap={4} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <Box>
            <Heading as="h3" size="md" color="fg.primary" mb={1}>
              DQL Editor
            </Heading>
            <Text color="fg.secondary" fontSize="sm">
              Write and execute DQL queries and mutations
            </Text>
          </Box>
          <HStack gap={2} align="center">
            <FullscreenToggle
              isFullscreen={isFullscreen}
              onToggle={() => setIsFullscreen(!isFullscreen)}
            />
            <Button
              onClick={() => {
                setShowGuide(!showGuide);
                if (showHistory) setShowHistory(false);
              }}
              variant={showGuide ? 'solid' : 'outline'}
              colorPalette={showGuide ? 'blue' : 'gray'}
              size="sm"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginRight: '8px' }}>
                <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Guide
            </Button>
            <Button
              onClick={() => {
                setShowHistory(!showHistory);
                if (showGuide) setShowGuide(false);
              }}
              variant={showHistory ? 'solid' : 'outline'}
              colorPalette={showHistory ? 'blue' : 'gray'}
              size="sm"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginRight: '8px' }}>
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
            </Button>
            <Button
              onClick={handleRunOperation}
              loading={isLoading}
              loadingText="Running..."
              disabled={!connected}
              colorPalette="blue"
              size="md"
              h="40px"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginRight: '8px' }}>
                <path d="M8 5v14l11-7z" />
              </svg>
              {`Run ${activeTab === 'query' ? 'Query' : 'Mutation'}`}
            </Button>
          </HStack>
        </HStack>

        {/* Tabs */}
        <HStack borderBottom="1px" borderColor="border.primary" gap={0}>
          <Button
            onClick={() => setActiveTab('query')}
            variant="ghost"
            size="sm"
            color={activeTab === 'query' ? 'accent.primary' : 'fg.secondary'}
            borderBottom="2px"
            borderColor={activeTab === 'query' ? 'accent.primary' : 'transparent'}
            borderRadius="0"
            _hover={{ bg: 'transparent' }}
            px={4}
            py={2}
          >
            Query
          </Button>
          <Button
            onClick={() => setActiveTab('mutation')}
            variant="ghost"
            size="sm"
            color={activeTab === 'mutation' ? 'accent.primary' : 'fg.secondary'}
            borderBottom="2px"
            borderColor={activeTab === 'mutation' ? 'accent.primary' : 'transparent'}
            borderRadius="0"
            _hover={{ bg: 'transparent' }}
            px={4}
            py={2}
          >
            Mutation
          </Button>
        </HStack>

        {error && (
          <Alert.Root status="error" variant="subtle">
            <Alert.Indicator />
            <Alert.Content>
              <Text fontSize="sm">{error}</Text>
            </Alert.Content>
          </Alert.Root>
        )}

        {showGuide && (
          <GuidedExperience
            guides={guides}
            onLoadQuery={(queryText) => {
              setQuery(queryText);
              setActiveTab('query');
              setShowGuide(false);
            }}
            onClose={() => setShowGuide(false)}
          />
        )}

        {showHistory && (
          <QueryHistory
            history={queryHistory}
            onSelectQuery={handleSelectQuery}
            onClearHistory={handleClearHistory}
            onDeleteQuery={handleDeleteQuery}
          />
        )}

        <Box position="relative">
          <Box
            layerStyle="code-editor"
            borderRadius="md"
            overflow="hidden"
          >
            <CodeMirror
              value={activeTab === 'query' ? query : mutation}
              height={isFullscreen ? 'calc(100vh - 230px)' : '200px'}
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

        <VStack gap={1} align="start">
          <Text fontSize="sm" color="fg.secondary">
            Enter a DQL query to execute against your Dgraph database.
          </Text>
          <Text fontSize="sm" color="fg.tertiary">
            Example: <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs">{`{ q(func: has(name)) { uid name } }`}</code>
          </Text>
        </VStack>
      </VStack>
    </Card.Root>
  );
}
