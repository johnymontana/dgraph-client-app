'use client';

import React, { useState, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { useDgraph } from '@/context/DgraphContext';
import DQLAutocomplete from './DQLAutocomplete';

interface QueryEditorProps {
  onQueryResult: (data: any) => void;
}

export default function QueryEditor({ onQueryResult }: QueryEditorProps) {
  const { dgraphService, connected, parsedSchema } = useDgraph();
  const [query, setQuery] = useState('{\n  # Enter your DQL query here\n  # Example:\n  # q(func: has(name)) {\n  #   uid\n  #   name\n  # }\n}');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const editorRef = useRef<HTMLDivElement>(null);

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
        <button
          onClick={handleRunQuery}
          disabled={isLoading || !connected}
          className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? 'Running...' : 'Run Query'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
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
