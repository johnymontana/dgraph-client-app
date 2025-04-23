'use client';

import React, { useState } from 'react';
import { useDgraph } from '@/context/DgraphContext';

export default function ConnectionForm() {
  const { endpoint, apiKey, setEndpoint, setApiKey, connect, disconnect, connected, error } = useDgraph();
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await connect();
    setIsLoading(false);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Dgraph Connection</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleConnect}>
        <div className="mb-4">
          <label htmlFor="endpoint" className="block text-sm font-medium text-gray-700 mb-1">
            Dgraph Endpoin
          </label>
          <input
            type="text"
            id="endpoint"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            disabled={connected}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="http://localhost:8080"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Example: http://localhost:8080
          </p>
        </div>

        <div className="mb-4">
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
            API Key (optional)
          </label>
          <input
            type="password"
            id="apiKey"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={connected}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter API key if required"
          />
        </div>

        {!connected ? (
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Connecting...' : 'Connect'}
          </button>
        ) : (
          <button
            type="button"
            onClick={disconnect}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Disconnec
          </button>
        )}
      </form>
    </div>
  );
}
