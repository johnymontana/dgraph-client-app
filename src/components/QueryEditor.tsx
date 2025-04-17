'use client';

import React, { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { useDgraph } from '@/context/DgraphContext';

interface QueryEditorProps {
  onQueryResult: (data: any) => void;
}

export default function QueryEditor({ onQueryResult }: QueryEditorProps) {
  const { dgraphService, connected } = useDgraph();
  const [query, setQuery] = useState('{\n  # Enter your DQL query here\n  # Example:\n  # q(func: has(name)) {\n  #   uid\n  #   name\n  # }\n}');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      
      <div className="border border-gray-300 rounded-md overflow-hidden mb-4">
        <CodeMirror
          value={query}
          height="200px"
          extensions={[sql()]}
          onChange={(value) => setQuery(value)}
          theme="light"
          className="text-sm"
        />
      </div>
      
      <div className="text-sm text-gray-500">
        <p>Enter a DQL query to execute against your Dgraph database.</p>
        <p className="mt-1">Example: <code>{`{ q(func: has(name)) { uid name } }`}</code></p>
      </div>
    </div>
  );
}
