'use client';

import React, { useState, useRef, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { useDgraph } from '@/context/DgraphContext';
import DQLAutocomplete from './DQLAutocomplete';
import QueryHistory, { QueryHistoryItem } from './QueryHistory';

interface QueryEditorProps {
  onQueryResult: (data: any) => void;
}

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

export default function QueryEditor({ onQueryResult }: QueryEditorProps) {
  const { dgraphService, connected, parsedSchema } = useDgraph();
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
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

  // Handle cursor position changes
  const handleEditorChange = (value: string, viewUpdate: any) => {
    setQuery(value);
    setCursorPosition(viewUpdate.state.selection.main.head);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string) => {
    // Get the current word at cursor
    const beforeCursor = query.substring(0, cursorPosition);
    const afterCursor = query.substring(cursorPosition);
    const wordMatch = beforeCursor.match(/[\w]*$/);

    if (wordMatch) {
      // Replace the current word with the suggestion
      const wordStart = cursorPosition - wordMatch[0].length;
      const newQuery = query.substring(0, wordStart) + suggestion + afterCursor;
      setQuery(newQuery);
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

  // Add a query to history
  const addToHistory = (queryText: string) => {
    // Don't add empty or default queries to history
    if (!queryText.trim() || queryText === DEFAULT_QUERY) return;

    // Create a new history item
    const newItem: QueryHistoryItem = {
      id: Date.now().toString(),
      query: queryText,
      timestamp: Date.now(),
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
  const handleSelectQuery = (selectedQuery: string) => {
    setQuery(selectedQuery);
    setShowHistory(false);
  };

  const handleRunQuery = async () => {
    if (!dgraphService || !connected) {
      setError('Not connected to Dgraph. Please connect first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const result = await dgraphService.query(query);
      onQueryResult(result);
      // Add successful query to history
      addToHistory(query);
    } catch (err: any) {
      console.error('Query error:', err);
      setError(err.response?.data?.errors?.[0]?.message || err.message || 'Failed to execute query');
      onQueryResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">DQL Query</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            title="View query history"
          >
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
            </span>
          </button>
          <button
            onClick={handleRunQuery}
            disabled={isLoading || !connected}
            className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Running...' : 'Run Query'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {showHistory && (
        <QueryHistory
          history={queryHistory}
          onSelectQuery={handleSelectQuery}
          onClearHistory={handleClearHistory}
          onDeleteQuery={handleDeleteQuery}
        />
      )}
      
      <div className="relative">
        <CodeMirror
          value={query}
          height="200px"
          onChange={handleEditorChange}
          theme="light"
          className="text-sm"
        />
        <div ref={editorRef}>
          <DQLAutocomplete
            editorRef={editorRef}
            query={query}
            cursorPosition={cursorPosition}
            schema={parsedSchema}
            onSuggestionSelect={handleSuggestionSelect}
          />
        </div>
      </div>
      
      <div className="text-sm text-gray-500">
        <p>Enter a DQL query to execute against your Dgraph database.</p>
        <p className="mt-1">Example: <code>{`{ q(func: has(name)) { uid name } }`}</code></p>
      </div>
    </div>
  );
}
