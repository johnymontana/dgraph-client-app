'use client';

import React, { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { useDgraph } from '@/context/DgraphContext';

export default function SchemaEditor() {
  const { dgraphService, connected } = useDgraph();
  const [schema, setSchema] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (connected && dgraphService) {
      fetchSchema();
    }
  }, [connected, dgraphService]);

  const fetchSchema = async () => {
    if (!dgraphService || !connected) {
      setError('Not connected to Dgraph. Please connect first.');
      return;
    }

    setIsFetching(true);
    setError(null);
    
    try {
      const result = await dgraphService.getSchema();
      if (result && result.data && result.data.schema) {
        const schemaText = result.data.schema.map((item: any) => {
          return `${item.predicate}: ${item.type} ${item.index ? '@index(' + item.index + ')' : ''} ${item.upsert ? '@upsert' : ''} ${item.lang ? '@lang' : ''} ${item.reverse ? '@reverse' : ''} .`;
        }).join('\n');
        setSchema(schemaText);
      } else {
        setSchema('# No schema found or empty schema');
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

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await dgraphService.alter(schema);
      setSuccess('Schema updated successfully');
      // Refresh schema after update
      await fetchSchema();
    } catch (err: any) {
      console.error('Schema update error:', err);
      setError(err.response?.data?.errors?.[0]?.message || err.message || 'Failed to update schema');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">DQL Schema</h2>
        <div className="flex space-x-2">
          <button
            onClick={fetchSchema}
            disabled={isFetching || !connected}
            className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
          >
            {isFetching ? 'Fetching...' : 'Refresh Schema'}
          </button>
          <button
            onClick={handleUpdateSchema}
            disabled={isLoading || !connected}
            className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Updating...' : 'Update Schema'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      <div className="border border-gray-300 rounded-md overflow-hidden mb-4">
        <CodeMirror
          value={schema}
          height="300px"
          extensions={[sql()]}
          onChange={(value) => setSchema(value)}
          theme="light"
          className="text-sm"
        />
      </div>
      
      <div className="text-sm text-gray-500">
        <p>Edit the DQL schema above and click "Update Schema" to apply changes.</p>
        <p className="mt-1">Example: <code>name: string @index(exact) .</code></p>
      </div>
    </div>
  );
}
